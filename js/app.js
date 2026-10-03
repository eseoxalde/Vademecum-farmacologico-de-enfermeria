// ============ Vademecum de Enfermería - App principal ============
// SPA con ruteo por hash, pensada para funcionar offline (PWA).

const state = {
  farmacos: [],
  actualizado: null,
  version: null,
  cargando: true,
};

const root = document.getElementById("app");

// ---------- Tema (automático / claro / oscuro) ----------
const TEMA_KEY = "vademecum_tema";
let temaActual = "auto";
function temaGuardado() {
  try {
    return localStorage.getItem(TEMA_KEY) || "auto";
  } catch (_) {
    return "auto";
  }
}
function aplicarTema(t) {
  temaActual = t;
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  try {
    if (t === "auto") localStorage.removeItem(TEMA_KEY);
    else localStorage.setItem(TEMA_KEY, t);
  } catch (_) {
    /* sin almacenamiento: se aplica solo en esta sesión */
  }
}
aplicarTema(temaGuardado());

const SVG_TEMA = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const TEMAS = [
  [
    "auto",
    "Automático",
    SVG_TEMA(
      '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>',
    ),
  ],
  [
    "light",
    "Claro",
    SVG_TEMA(
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    ),
  ],
  [
    "dark",
    "Oscuro",
    SVG_TEMA('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
  ],
];
function infoTema() {
  return TEMAS.find((t) => t[0] === temaActual) || TEMAS[0];
}
function pintarBotonTema(b) {
  const [, nombre, icono] = infoTema();
  b.innerHTML = icono;
  b.setAttribute("aria-label", `Tema de color: ${nombre}. Tocar para cambiar`);
  b.title = `Tema: ${nombre}`;
}
function botonTemaHtml() {
  const [, nombre, icono] = infoTema();
  return `<button type="button" class="topbar__theme" aria-label="Tema de color: ${nombre}. Tocar para cambiar" title="Tema: ${nombre}">${icono}</button>`;
}

// ---------- Utilidades ----------
function esc(t) {
  return String(t).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function anunciar(msg) {
  const el = document.getElementById("anuncios");
  if (el) el.textContent = msg;
}
// Divide por ";" ignorando los que están dentro de paréntesis.
function partirLista(txt) {
  const partes = [];
  let actual = "",
    prof = 0;
  for (const ch of txt) {
    if (ch === "(") prof++;
    if (ch === ")") prof = Math.max(0, prof - 1);
    if (ch === ";" && prof === 0) {
      partes.push(actual);
      actual = "";
    } else actual += ch;
  }
  partes.push(actual);
  return partes.map((p) => p.trim()).filter(Boolean);
}
function formatearValor(valor) {
  if (Array.isArray(valor))
    return `<ul class="field__list">${valor
      .filter(Boolean)
      .map((p) => `<li>${esc(p)}</li>`)
      .join("")}</ul>`;
  const partes = partirLista(String(valor).trim());
  if (partes.length < 2) return esc(partes[0] || valor);
  return `<ul class="field__list">${partes.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`;
}
const ALFABETO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

// ---------- Carga de datos ----------
async function cargarDatos() {
  try {
    const res = await fetch("data/farmacos.json", { cache: "no-cache" });
    const json = await res.json();
    state.farmacos = json.farmacos || [];
    state.actualizado = json.actualizado || null;
    state.version = json.version || null;
  } catch (e) {
    try {
      const respaldo = JSON.parse(
        localStorage.getItem("vademecum_farmacos_cache") || "{}",
      );
      state.farmacos = respaldo.farmacos || [];
      state.actualizado = respaldo.actualizado || null;
      state.version = respaldo.version || null;
    } catch (_) {
      state.farmacos = [];
    }
  }
  if (state.farmacos.length) {
    try {
      localStorage.setItem(
        "vademecum_farmacos_cache",
        JSON.stringify({
          version: state.version,
          actualizado: state.actualizado,
          farmacos: state.farmacos,
        }),
      );
    } catch (_) {
      /* sin espacio o modo privado: se usa solo el Service Worker */
    }
  }
  state.cargando = false;
}

function normalizar(txt) {
  return (txt || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// ---------- Router ----------
function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [modo, sub, id] = hash.split("/").filter(Boolean);
  return {
    modo: modo || "",
    sub: sub || "",
    id: id ? decodeURIComponent(id) : "",
  };
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", async () => {
  await cargarDatos();
  render();
  actualizarEstadoConexion();
});
window.addEventListener("online", actualizarEstadoConexion);
window.addEventListener("offline", actualizarEstadoConexion);

function actualizarEstadoConexion() {
  const pill = document.getElementById("connPill");
  if (!pill) return;
  if (navigator.onLine) {
    pill.textContent = "En línea";
    pill.dataset.state = "online";
  } else {
    pill.textContent = "Sin conexión · modo offline";
    pill.dataset.state = "offline";
  }
}

let primeraVista = true;
function render() {
  window.scrollTo(0, 0);
  renderVista();
  const t = root.querySelector(".topbar__title");
  const base = "Vademécum de Enfermería",
    nom = t ? t.textContent.trim() : "";
  document.title = nom && nom !== base ? `${nom} · ${base}` : base;
  if (!primeraVista && t) {
    t.setAttribute("tabindex", "-1");
    t.focus({ preventScroll: true });
  }
  primeraVista = false;
}

function renderVista() {
  const { modo, sub, id } = parseHash();

  if (!modo) return renderHome();
  if ((modo === "ficha-tecnica" || modo === "tarjetas") && !sub)
    return renderLista(modo);
  if ((modo === "ficha-tecnica" || modo === "tarjetas") && sub === "d" && id)
    return renderDetalle(modo, id);
  return renderHome();
}

// ---------- Topbar helper ----------
function topbar({ titulo, subtitulo = "", volver = null, heading = true }) {
  return `
    <header class="topbar">
      ${volver ? `<button class="topbar__back" onclick="location.hash='${volver}'" aria-label="Volver" type="button"><span aria-hidden="true">‹</span></button>` : ""}
      <div>
        <div class="topbar__title"${heading ? ' role="heading" aria-level="1"' : ""}>${esc(titulo)}</div>
        ${subtitulo ? `<div class="topbar__subtitle">${subtitulo}</div>` : ""}
      </div>
      <span class="offline-pill" id="connPill" data-state="online">En línea</span>
      ${botonTemaHtml()}
    </header>
  `;
}

// ---------- Footer helper ----------
function formatearFecha(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const meses = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const mi = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${meses[mi] || m} ${y}`;
}

function appFooter() {
  return `
    <footer class="app-footer">
      <p>© ${new Date().getFullYear()} Cátedra de Farmacología en Enfermería · Uso académico · Todos los derechos reservados</p>
      ${state.actualizado ? `<p>Última actualización de contenidos: ${formatearFecha(state.actualizado)}${state.version ? ` · v${state.version}` : ""}</p>` : ""}
      <p>Material educativo: no reemplaza el criterio clínico, los prospectos oficiales ni las guías institucionales.</p>
    </footer>
  `;
}

// ---------- Vista: Home ----------
function renderHome() {
  root.innerHTML = `
    ${topbar({ titulo: "Vademécum de Enfermería", heading: false })}
    <main class="home">
      <div class="home__eyebrow">Cátedra de Enfermería</div>
      <h1 class="home__title">Consultá fármacos por ficha técnica o tarjeta rápida</h1>
      <p class="home__desc">Elegí el tipo de información que necesitás. Funciona sin conexión una vez cargado.</p>
      <div class="home__grid">
        <a class="mode-card mode-card--ficha" href="#/ficha-tecnica">
          <span class="mode-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>
          </span>
          <span class="mode-card__body">
            <h2>Ficha técnica</h2>
            <p>Farmacodinamia, ADME, indicaciones, dosis, preparación e información completa.</p>
          </span>
        </a>
        <a class="mode-card mode-card--tarjetas" href="#/tarjetas">
          <span class="mode-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>
          </span>
          <span class="mode-card__body">
            <h2>Tarjetas</h2>
            <p>Resumen rápido para la práctica: dosis, vías, cuidados y alarmas de riesgo.</p>
          </span>
        </a>
      </div>
      <p class="home__footer">${state.farmacos.length} fármacos cargados</p>
    </main>
    ${appFooter()}
  `;
  actualizarEstadoConexion();
}

// ---------- Vista: Lista ----------
function filtrarFarmacos(texto, letra) {
  let lista = state.farmacos
    .slice()
    .sort(
      (a, b) =>
        (a.letra || "").localeCompare(b.letra || "", "es") ||
        a.nombre_generico.localeCompare(b.nombre_generico, "es"),
    );
  if (letra)
    lista = lista.filter((f) => (f.letra || "").toUpperCase() === letra);
  if (texto) {
    const q = normalizar(texto);
    lista = lista.filter((f) =>
      normalizar(
        [
          f.nombre_generico,
          f.farmacodinamia?.principio_activo,
          f.farmacodinamia?.clasificacion,
        ].join(" "),
      ).includes(q),
    );
  }
  return lista;
}

function itemsLista(modo, lista) {
  if (!lista.length)
    return `<li class="empty-state">No se encontraron fármacos con ese criterio.</li>`;
  return lista
    .map(
      (f) => `
        <li class="drug-list__item">
          <a class="drug-list__link" href="#/${modo}/d/${encodeURIComponent(f.id)}">
            <span>
              <span class="drug-list__name">${esc(f.nombre_generico)}</span>
              <span class="drug-list__meta">${esc(f.farmacodinamia?.clasificacion || "")}</span>
            </span>
            ${f.alto_riesgo ? '<span class="risk-badge">ALTO RIESGO</span>' : ""}
          </a>
        </li>`,
    )
    .join("");
}

function renderLista(modo) {
  const titulo = modo === "ficha-tecnica" ? "Ficha técnica" : "Tarjetas";
  let texto = "",
    letra = "";
  const letrasDisponibles = new Set(
    state.farmacos.map((f) => (f.letra || "").toUpperCase()),
  );

  root.innerHTML = `
    ${topbar({ titulo, subtitulo: `${state.farmacos.length} fármacos`, volver: "#/" })}
    <main>
    <div class="list-controls">
      <div class="search-box">
        <label for="buscador" class="sr-only">Buscar fármaco por nombre o grupo</label>
        <input id="buscador" type="search" inputmode="search" autocomplete="off" placeholder="Buscar por nombre o grupo (ej. anticoagulantes)..." />
      </div>
      <div class="alphabet" id="alfabeto" role="group" aria-label="Filtrar por letra">
        <button type="button" class="alphabet__chip" data-letra="" data-active="true" aria-pressed="true">Todas</button>
        ${ALFABETO.map((l) => `<button type="button" class="alphabet__chip" data-letra="${l}" data-active="false" aria-pressed="false" aria-label="Letra ${l}" ${letrasDisponibles.has(l) ? "" : "disabled"}>${l}</button>`).join("")}
      </div>
    </div>
    <ul class="drug-list" id="listaFarmacos"></ul>
    </main>
    ${appFooter()}
  `;
  actualizarEstadoConexion();

  const ul = document.getElementById("listaFarmacos");
  function actualizar() {
    const lista = filtrarFarmacos(texto, letra);
    ul.innerHTML = itemsLista(modo, lista);
    document.querySelectorAll("#alfabeto [data-letra]").forEach((b) => {
      const activo = b.dataset.letra === letra;
      b.dataset.active = String(activo);
      b.setAttribute("aria-pressed", String(activo));
    });
    anunciar(`${lista.length} ${lista.length === 1 ? "fármaco" : "fármacos"}`);
  }
  actualizar();
  anunciar("");

  document.getElementById("buscador").addEventListener("input", (e) => {
    texto = e.target.value;
    actualizar();
  });
  document.getElementById("alfabeto").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-letra]");
    if (!btn || btn.disabled) return;
    letra = btn.dataset.letra === letra ? "" : btn.dataset.letra;
    actualizar();
  });
}

// ---------- Vista: Detalle ----------
function campo(label, valor, mono = false) {
  if (!valor || (Array.isArray(valor) && !valor.filter(Boolean).length))
    return "";
  return `
    <div class="field">
      <div class="field__label">${label}</div>
      <div class="field__value ${mono ? "mono" : ""}">${formatearValor(valor)}</div>
    </div>
  `;
}

function seccion(id, titulo, contenidoHtml) {
  if (!contenidoHtml) return "";
  return `
    <section class="section" id="${id}" data-collapsed="false">
      <h2 class="section__heading">
        <button type="button" class="section__header" aria-expanded="true" aria-controls="body-${id}" data-toggle="${id}">
          <span>${titulo}</span>
          <span class="section__chevron" aria-hidden="true">▾</span>
        </button>
      </h2>
      <div class="section__body" id="body-${id}">${contenidoHtml}</div>
    </section>
  `;
}

function renderDetalle(modo, id) {
  const f = state.farmacos.find((x) => x.id === id);
  const volver = `#/${modo}`;

  if (!f) {
    root.innerHTML = `
      ${topbar({ titulo: "No encontrado", volver })}
      <main class="detail"><p class="empty-state">No se encontró el fármaco solicitado.</p></main>
    `;
    return;
  }

  const riskBanner = f.alto_riesgo
    ? `
    <div class="risk-banner"><span aria-hidden="true">⚠</span> Medicamento de alto riesgo: extremar el doble chequeo antes de administrar.</div>
  `
    : "";

  let cuerpo = "";

  if (modo === "ficha-tecnica") {
    cuerpo = `
      ${seccion(
        "farmacodinamia",
        "Farmacodinamia",
        `
        ${campo("Principio activo", f.farmacodinamia?.principio_activo)}
        ${campo("Clasificación", f.farmacodinamia?.clasificacion)}
        ${campo("Efecto terapéutico", f.farmacodinamia?.efecto_terapeutica ?? f.farmacodinamia?.accion_terapeutica)}
        ${campo("Mecanismo de acción", f.farmacodinamia?.mecanismo_accion)}
      `,
      )}
      ${seccion(
        "adme",
        "Farmacocinética (ADME)",
        `
        ${campo("Absorción", f.farmacocinetica_adme?.absorcion)}
        ${campo("Distribución", f.farmacocinetica_adme?.distribucion)}
        ${campo("Metabolismo", f.farmacocinetica_adme?.metabolismo)}
        ${campo("Eliminación", f.farmacocinetica_adme?.eliminacion)}
      `,
      )}
      ${seccion(
        "clinico",
        "Uso clínico",
        `
        ${campo("Indicaciones", f.indicaciones)}
        ${campo("Contraindicaciones", f.contraindicaciones)}
        ${campo("Precauciones", f.precauciones)}
        ${campo("Advertencias", f.advertencias)}
        ${campo("Embarazo y lactancia", f.embarazo_lactancia)}
      `,
      )}
      ${seccion(
        "ajustes",
        "Ajustes de dosis",
        `
        ${campo("Renal", f.ajustes?.renal)}
        ${campo("Hepático", f.ajustes?.hepatico)}
      `,
      )}
      ${seccion(
        "seguridad",
        "Seguridad",
        `
        ${campo("Interacciones farmacológicas", f.interacciones)}
        ${campo("Reacciones adversas", f.reacciones_adversas)}
        ${campo("Toxicidad y sobredosis", f.toxicidad_sobredosis)}
        ${campo("Antídotos", f.antidotos)}
      `,
      )}
      ${seccion(
        "monitorizacion",
        "Monitorización",
        `
        ${campo("Clínica", f.monitorizacion?.clinica)}
        ${campo("Laboratorio", f.monitorizacion?.laboratorio)}
      `,
      )}
      ${seccion(
        "valoracion",
        "Parámetros de valoración",
        `
        ${campo("Antes", f.parametros_valoracion?.antes)}
        ${campo("Durante", f.parametros_valoracion?.durante)}
        ${campo("Después", f.parametros_valoracion?.despues)}
      `,
      )}
      ${seccion(
        "dosis",
        "Presentaciones y dosis",
        `
        ${campo("Presentaciones", f.presentaciones)}
        ${campo("Vías de administración", f.vias_administracion)}
        ${campo("Dosis adultos", f.dosis?.adultos)}
        ${campo("Dosis pediátrica", f.dosis?.pediatrico)}
        ${campo("Dosis geriátrica", f.dosis?.geriatrico)}
      `,
      )}
      ${seccion(
        "preparacion",
        "Preparación y administración",
        `
        ${campo("Dilución", f.preparacion?.dilucion)}
        ${campo("Compatibilidad IV", f.preparacion?.compatibilidad_iv)}
        ${campo("Velocidad de infusión", f.velocidad_infusion)}
        ${campo("Estabilidad de la solución", f.estabilidad_soluciones)}
        ${campo("Concentración máxima", f.concentracion, true)}
        ${campo("Alarma de riesgo", f.alarma_riesgo)}
      `,
      )}
    `;
  } else {
    cuerpo = `
      ${seccion(
        "resumen",
        "Resumen",
        `
        ${campo("Efecto terapéutico", f.farmacodinamia?.efecto_terapeutica ?? f.farmacodinamia?.accion_terapeutica)}
        ${campo("Presentaciones", f.presentaciones)}
        ${campo("Vías de administración", f.vias_administracion)}
      `,
      )}
      ${seccion(
        "dosis",
        "Dosis estándar",
        `
        ${campo("Adultos", f.dosis?.adultos)}
        ${campo("Pediátrico", f.dosis?.pediatrico)}
        ${campo("Geriátrico", f.dosis?.geriatrico)}
      `,
      )}
      ${seccion(
        "preparacion",
        "Preparación",
        `
        ${campo("Dilución", f.preparacion?.dilucion)}
        ${campo("Compatibilidad IV", f.preparacion?.compatibilidad_iv)}
        ${campo("Velocidad de infusión", f.velocidad_infusion)}
        ${campo("Estabilidad de la solución", f.estabilidad_soluciones)}
        ${campo("Concentración máxima", f.concentracion, true)}
      `,
      )}
      ${seccion(
        "seguridad",
        "Seguridad y cuidados",
        `
        ${campo("Antídotos", f.antidotos)}
        ${campo("Alarma de riesgo", f.alarma_riesgo)}
        ${campo("Cuidados de enfermería", f.cuidados_enfermeria?.cuidados)}
        ${campo("Educación al paciente", f.cuidados_enfermeria?.educacion_paciente)}
      `,
      )}
      ${seccion(
        "monitorizacion",
        "Monitorización y valoración",
        `
        ${campo("Clínica", f.monitorizacion?.clinica)}
        ${campo("Laboratorio", f.monitorizacion?.laboratorio)}
        ${campo("Antes", f.parametros_valoracion?.antes)}
        ${campo("Durante", f.parametros_valoracion?.durante)}
        ${campo("Después", f.parametros_valoracion?.despues)}
      `,
      )}
    `;
  }

  root.innerHTML = `
    ${topbar({ titulo: f.nombre_generico, subtitulo: modo === "ficha-tecnica" ? "Ficha técnica" : "Tarjeta", volver })}
    <main class="detail">
      ${riskBanner}
      <div class="detail__toolbar">
        <button type="button" class="btn-link" id="btnExpandirTodo">Expandir todo</button>
        <span class="detail__toolbar-sep">·</span>
        <button type="button" class="btn-link" id="btnColapsarTodo">Colapsar todo</button>
      </div>
      ${cuerpo}
    </main>
    ${appFooter()}
  `;
  actualizarEstadoConexion();
  inicializarAcordeon();
}

// ---------- Acordeón de secciones ----------
function alternarSeccion(section, colapsar) {
  const header = section.querySelector(".section__header");
  const body = section.querySelector(".section__body");
  const debeColapsar =
    colapsar !== undefined ? colapsar : section.dataset.collapsed !== "true";
  section.dataset.collapsed = String(debeColapsar);
  header.setAttribute("aria-expanded", String(!debeColapsar));
  body.style.display = debeColapsar ? "none" : "";
}

function inicializarAcordeon() {
  document.querySelectorAll(".section__header").forEach((header) => {
    header.addEventListener("click", () => {
      const section = header.closest(".section");
      alternarSeccion(section);
    });
  });

  const btnExpandir = document.getElementById("btnExpandirTodo");
  const btnColapsar = document.getElementById("btnColapsarTodo");
  if (btnExpandir) {
    btnExpandir.addEventListener("click", () => {
      document
        .querySelectorAll(".section")
        .forEach((s) => alternarSeccion(s, false));
    });
  }
  if (btnColapsar) {
    btnColapsar.addEventListener("click", () => {
      document
        .querySelectorAll(".section")
        .forEach((s) => alternarSeccion(s, true));
    });
  }
}

// ---------- Botón de tema (automático → claro → oscuro) ----------
document.addEventListener("click", (e) => {
  const b = e.target.closest(".topbar__theme");
  if (!b) return;
  const i = TEMAS.findIndex((t) => t[0] === temaActual);
  aplicarTema(TEMAS[(i + 1) % TEMAS.length][0]);
  pintarBotonTema(b);
  anunciar(`Tema ${infoTema()[1].toLowerCase()}`);
});
