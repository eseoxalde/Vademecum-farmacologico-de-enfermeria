// Utilidades compartidas del ABM (el guion bajo evita que Vercel lo publique como función).
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const LOCAL = process.env.ABM_LOCAL === "1"; // modo prueba: edita data/farmacos.json directamente
const REPO = process.env.GITHUB_REPO || "eseoxalde/vademecum";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const RUTA = "data/farmacos.json";
const RUTA_LOCAL = path.join(__dirname, "..", RUTA);
const HORAS = 8;

class ErrHttp extends Error {
  constructor(status, msg, extra = {}) {
    super(msg);
    this.status = status;
    Object.assign(this, extra);
  }
}

// ---------- Esquema de un fármaco (única fuente: validación + formulario) ----------
const G = (grupo, campos) =>
  campos.map(([ruta, label, tipo = "texto"]) => ({ grupo, ruta, label, tipo }));
const CAMPOS = [
  ...G("Datos básicos", [
    ["nombre_generico", "Nombre genérico", "linea"],
    ["letra", "Letra del abecedario", "letra"],
    ["alto_riesgo", "Medicamento de alto riesgo", "bool"],
  ]),
  ...G("Farmacodinamia", [
    ["farmacodinamia.principio_activo", "Principio activo", "linea"],
    ["farmacodinamia.clasificacion", "Clasificación"],
    ["farmacodinamia.efecto_terapeutica", "Efecto terapéutico"],
    ["farmacodinamia.mecanismo_accion", "Mecanismo de acción"],
  ]),
  ...G("Farmacocinética (ADME)", [
    ["farmacocinetica_adme.absorcion", "Absorción"],
    ["farmacocinetica_adme.distribucion", "Distribución"],
    ["farmacocinetica_adme.metabolismo", "Metabolismo"],
    ["farmacocinetica_adme.eliminacion", "Eliminación"],
  ]),
  ...G("Uso clínico", [
    ["indicaciones", "Indicaciones"],
    ["contraindicaciones", "Contraindicaciones"],
    ["precauciones", "Precauciones"],
    ["advertencias", "Advertencias"],
    ["embarazo_lactancia", "Embarazo y lactancia"],
  ]),
  ...G("Ajustes de dosis", [
    ["ajustes.renal", "Ajuste renal"],
    ["ajustes.hepatico", "Ajuste hepático"],
  ]),
  ...G("Seguridad", [
    ["interacciones", "Interacciones farmacológicas"],
    ["reacciones_adversas", "Reacciones adversas"],
    ["toxicidad_sobredosis", "Toxicidad y sobredosis"],
    ["antidotos", "Antídotos"],
  ]),
  ...G("Monitorización y valoración", [
    ["monitorizacion.clinica", "Monitorización clínica"],
    ["monitorizacion.laboratorio", "Monitorización de laboratorio"],
    ["parametros_valoracion.antes", "Valoración: antes"],
    ["parametros_valoracion.durante", "Valoración: durante"],
    ["parametros_valoracion.despues", "Valoración: después"],
  ]),
  ...G("Presentaciones y dosis", [
    ["presentaciones", "Presentaciones"],
    ["dosis.adultos", "Dosis adultos"],
    ["dosis.pediatrico", "Dosis pediátrica"],
    ["dosis.geriatrico", "Dosis geriátrica"],
    ["vias_administracion", "Vías de administración"],
  ]),
  ...G("Preparación y administración", [
    ["preparacion.dilucion", "Dilución"],
    ["preparacion.compatibilidad_iv", "Compatibilidad IV"],
    ["velocidad_infusion", "Velocidad de infusión"],
    ["estabilidad_soluciones", "Estabilidad de la solución"],
    ["concentracion", "Concentración máxima"],
    ["alarma_riesgo", "Alarma de riesgo"],
  ]),
  ...G("Cuidados de enfermería", [
    [
      "cuidados_enfermeria.cuidados",
      "Cuidados de enfermería (uno por línea)",
      "lista",
    ],
    [
      "cuidados_enfermeria.educacion_paciente",
      "Educación al paciente (uno por línea)",
      "lista",
    ],
  ]),
];

const leer = (o, r) =>
  r.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const poner = (o, r, v) => {
  const p = r.split(".");
  let a = o;
  p.slice(0, -1).forEach((k) => (a = a[k] = a[k] || {}));
  a[p[p.length - 1]] = v;
};

// Devuelve el fármaco limpio (solo campos conocidos, textos recortados) o lanza error 400.
function validar(f) {
  if (!f || typeof f !== "object" || Array.isArray(f))
    throw new ErrHttp(400, "Los datos del fármaco no son válidos.");
  const errores = [],
    out = {};
  for (const c of CAMPOS) {
    const v = leer(f, c.ruta);
    if (c.tipo === "bool") {
      if (v !== undefined && typeof v !== "boolean")
        errores.push(`«${c.label}» debe ser true o false.`);
      poner(out, c.ruta, v === true);
      continue;
    }
    if (c.tipo === "lista") {
      // array de textos; también acepta un texto con un elemento por línea
      const items = Array.isArray(v)
        ? v
        : typeof v === "string"
          ? v.split("\n")
          : v == null
            ? []
            : null;
      if (!items || items.some((x) => typeof x !== "string")) {
        errores.push(`«${c.label}» debe ser una lista de textos.`);
        continue;
      }
      const limpio = items.map((x) => x.trim()).filter(Boolean);
      if (limpio.join("").length > 6000)
        errores.push(`«${c.label}» es demasiado largo.`);
      poner(out, c.ruta, limpio);
      continue;
    }
    const s = v == null ? "" : v;
    if (typeof s !== "string") {
      errores.push(`«${c.label}» debe ser texto.`);
      continue;
    }
    const t = s.trim();
    if (t.length > 6000) errores.push(`«${c.label}» es demasiado largo.`);
    if (c.ruta === "nombre_generico" && !t)
      errores.push("Falta el nombre genérico.");
    if (c.tipo === "letra" && !/^[A-ZÑ]$/.test(t))
      errores.push(
        "La letra debe ser una sola, de la A a la Z (o Ñ), en mayúscula.",
      );
    poner(out, c.ruta, t);
  }
  if (errores.length)
    throw new ErrHttp(400, errores.join(" "), { detalles: errores });
  return out;
}

// ---------- Sesión (cookie firmada) y usuarios ----------
function secreto() {
  const s =
    process.env.AUTH_SECRET || (LOCAL ? "secreto-local-de-prueba-1234" : "");
  if (s.length < 16)
    throw new ErrHttp(
      500,
      "Falta configurar AUTH_SECRET (mínimo 16 caracteres).",
    );
  return s;
}
const firmar = (obj) => {
  const p = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return (
    p +
    "." +
    crypto.createHmac("sha256", secreto()).update(p).digest("base64url")
  );
};
function sesion(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)abm_sesion=([^;]+)/);
  if (m) {
    const [p, s] = m[1].split(".");
    const esperada = crypto
      .createHmac("sha256", secreto())
      .update(p || "")
      .digest("base64url");
    if (
      s &&
      s.length === esperada.length &&
      crypto.timingSafeEqual(Buffer.from(s), Buffer.from(esperada))
    ) {
      try {
        const d = JSON.parse(Buffer.from(p, "base64url").toString());
        if (d.exp > Date.now()) return d;
      } catch (_) {
        /* cae al error de abajo */
      }
    }
  }
  throw new ErrHttp(401, "Necesitás iniciar sesión.");
}
const cookie = (valor, seg) =>
  `abm_sesion=${valor}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${seg}${process.env.VERCEL ? "; Secure" : ""}`;

function usuarios() {
  let u = [];
  try {
    u = JSON.parse(process.env.ABM_USUARIOS || "[]");
  } catch (_) {
    throw new ErrHttp(500, "ABM_USUARIOS no es un JSON válido.");
  }
  if (!u.length && LOCAL)
    u = [
      { usuario: "admin", rol: "admin", clave: "demo" },
      { usuario: "editor", rol: "editor", clave: "demo" },
    ];
  return u;
}
function verificarClave(clave, guardada) {
  if (typeof guardada !== "string") return false;
  if (!guardada.startsWith("scrypt$")) return LOCAL && clave === guardada; // texto plano: solo en modo prueba
  const [, sal, hash] = guardada.split("$");
  const calc = crypto.scryptSync(clave, Buffer.from(sal, "hex"), 32);
  const real = Buffer.from(hash, "hex");
  return calc.length === real.length && crypto.timingSafeEqual(calc, real);
}
function mismoOrigen(req) {
  const o = req.headers.origin;
  if (o && new URL(o).host !== req.headers.host)
    throw new ErrHttp(403, "Origen no permitido.");
}

// ---------- Lectura y escritura del JSON (GitHub o archivo local) ----------
const gh = (ruta, op = {}) =>
  fetch(`https://api.github.com/repos/${REPO}/${ruta}`, {
    ...op,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "vademecum-abm",
      "Content-Type": "application/json",
    },
  });

async function leerArchivo() {
  if (LOCAL)
    return {
      datos: JSON.parse(fs.readFileSync(RUTA_LOCAL, "utf8")),
      sha: null,
    };
  if (!process.env.GITHUB_TOKEN)
    throw new ErrHttp(500, "Falta configurar GITHUB_TOKEN.");
  const r = await gh(`contents/${RUTA}?ref=${BRANCH}`);
  if (!r.ok)
    throw new ErrHttp(502, "No se pudo leer la base de datos en GitHub.");
  const m = await r.json();
  let b64 = m.content;
  if (!b64) {
    const rb = await gh(`git/blobs/${m.sha}`);
    b64 = (await rb.json()).content;
  } // archivos > 1 MB
  return {
    datos: JSON.parse(Buffer.from(b64, "base64").toString("utf8")),
    sha: m.sha,
  };
}
async function escribirArchivo(datos, sha, mensaje) {
  const texto = JSON.stringify(datos, null, 2) + "\n";
  if (LOCAL) {
    fs.writeFileSync(RUTA_LOCAL, texto);
    return;
  }
  const r = await gh(`contents/${RUTA}`, {
    method: "PUT",
    body: JSON.stringify({
      message: mensaje,
      content: Buffer.from(texto).toString("base64"),
      sha,
      branch: BRANCH,
    }),
  });
  if (r.status === 409 || r.status === 422)
    throw new ErrHttp(
      409,
      "Otra persona guardó al mismo tiempo. Probá de nuevo.",
      { reintentar: true },
    );
  if (!r.ok) throw new ErrHttp(502, "No se pudo guardar en GitHub.");
}
const hoy = () =>
  new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

// mutador(datos) cambia datos.farmacos y devuelve { mensaje, ...lo que quieras responder }
async function modificar(mutador) {
  for (let i = 0; ; i++) {
    const { datos, sha } = await leerArchivo();
    const res = mutador(datos);
    datos.actualizado = hoy();
    try {
      await escribirArchivo(datos, sha, res.mensaje);
      return res;
    } catch (e) {
      if (!e.reintentar || i >= 1) throw e;
    }
  }
}

const envolver = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (!(e instanceof ErrHttp)) console.error(e);
    res.status(e.status || 500).json({
      error: e instanceof ErrHttp ? e.message : "Error interno del servidor.",
    });
  }
};

module.exports = {
  ErrHttp,
  CAMPOS,
  validar,
  firmar,
  sesion,
  cookie,
  usuarios,
  verificarClave,
  mismoOrigen,
  leerArchivo,
  modificar,
  envolver,
  HORAS,
  LOCAL,
};
