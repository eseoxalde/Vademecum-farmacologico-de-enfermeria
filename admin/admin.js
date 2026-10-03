// Panel de administración (ABM) del Vademécum. Todo se guarda a través de /api/farmacos.
(function () {
  const app = document.getElementById("app");
  const $ = (id) => document.getElementById(id);
  const S = { usuario: null, rol: null, campos: [], lista: [], ed: null, aviso: "" };
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const norm = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const leer = (o, r) => r.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
  const poner = (o, r, v) => { const p = r.split("."); let a = o; p.slice(0, -1).forEach((k) => (a = a[k] = a[k] || {})); a[p[p.length - 1]] = v; };
  const inicial = (n) => { const c = String(n || "").trim().charAt(0).toUpperCase(); return c === "Ñ" ? c : c.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };

  // ---------- Tema (comparte la elección con la app) ----------
  const KEY = "vademecum_tema";
  const TEMAS = [["auto", "◐"], ["light", "☀"], ["dark", "☾"]];
  let tema = "auto";
  try { tema = localStorage.getItem(KEY) || "auto"; } catch (_) {}
  function aplicarTema(t) {
    tema = t;
    if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    try { if (t === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch (_) {}
  }
  aplicarTema(tema);

  // ---------- Comunicación con el servidor ----------
  async function api(url, op = {}) {
    const r = await fetch(url, {
      method: op.method || "GET",
      headers: op.body ? { "Content-Type": "application/json" } : {},
      body: op.body ? JSON.stringify(op.body) : undefined,
      credentials: "same-origin",
    });
    let j = {};
    try { j = await r.json(); } catch (_) {}
    if (r.status === 401 && !op.login) { S.usuario = null; vistaLogin("Tu sesión venció. Ingresá de nuevo."); throw new Error("sesion"); }
    if (!r.ok) throw new Error(j.error || "Error " + r.status);
    return j;
  }

  // ---------- Vistas ----------
  const barra = (titulo, volver) => `
    <header class="topbar">
      ${volver ? '<button type="button" class="topbar__back" data-accion="volver" aria-label="Volver"><span aria-hidden="true">‹</span></button>' : ""}
      <div style="min-width:0"><div class="topbar__title">${esc(titulo)}</div>
      ${S.usuario ? `<div class="topbar__subtitle">${esc(S.usuario)} · ${S.rol === "admin" ? "Administrador" : "Editor"}</div>` : ""}</div>
      <button type="button" class="topbar__theme" style="margin-left:auto" data-accion="tema" aria-label="Cambiar tema de color" title="Tema">${TEMAS.find((t) => t[0] === tema)[1]}</button>
      ${S.usuario ? '<button type="button" class="btn btn--ghost btn--sm" data-accion="salir">Salir</button>' : ""}
    </header>`;

  function vistaLogin(msg) {
    app.innerHTML = `${barra("Administración")}
      <main class="admin login">
        <h1>Ingresar</h1>
        ${msg ? `<div class="risk-banner" role="alert">${esc(msg)}</div>` : ""}
        <form id="fl">
          <label for="u">Usuario</label><input type="text" id="u" autocomplete="username" autocapitalize="none" required>
          <label for="c">Contraseña</label><input type="password" id="c" autocomplete="current-password" required>
          <button type="submit" class="btn btn--primary">Ingresar</button>
        </form>
      </main>`;
    $("fl").addEventListener("submit", async (e) => {
      e.preventDefault();
      const b = e.target.querySelector("button"); b.disabled = true; b.textContent = "Ingresando…";
      try {
        const j = await api("/api/sesion", { method: "POST", body: { usuario: $("u").value, clave: $("c").value }, login: true });
        S.usuario = j.usuario; S.rol = j.rol;
        await cargarLista();
      } catch (x) { vistaLogin(x.message); }
    });
  }

  async function cargarLista() {
    const j = await api("/api/farmacos");
    Object.assign(S, { usuario: j.usuario, rol: j.rol, campos: j.campos, lista: j.farmacos });
    S.lista.sort((a, b) => (a.letra || "").localeCompare(b.letra || "", "es") || a.nombre_generico.localeCompare(b.nombre_generico, "es"));
    vistaLista();
  }

  function vistaLista(filtro = "") {
    app.innerHTML = `${barra("Administración")}
      <main class="admin">
        ${S.aviso ? `<div class="aviso" role="status">${esc(S.aviso)}</div>` : ""}
        <div class="fila">
          <input type="search" id="q" placeholder="Buscar fármaco…" aria-label="Buscar fármaco" value="${esc(filtro)}">
          ${S.rol === "admin" ? '<button type="button" class="btn btn--primary" data-accion="nuevo">+ Nuevo</button>' : ""}
        </div>
        <p class="ayuda"><span id="cuenta"></span> · <a href="../">Ver la app</a></p>
        <ul class="lista" id="ul"></ul>
      </main>`;
    S.aviso = "";
    const pintar = () => {
      const q = norm($("q").value);
      const l = S.lista.filter((f) => norm(f.nombre_generico).includes(q));
      $("ul").innerHTML = l.map((f) => `<li><button type="button" class="item" data-accion="abrir" data-id="${esc(f.id)}"><span>${esc(f.nombre_generico)}</span>${f.alto_riesgo ? '<span class="risk-badge">ALTO RIESGO</span>' : ""}</button></li>`).join("") || '<li class="empty-state">No hay resultados.</li>';
      $("cuenta").textContent = `${l.length} de ${S.lista.length} fármacos`;
    };
    $("q").addEventListener("input", pintar);
    pintar();
  }

  const conId = (d) => (S.ed.id ? Object.assign({ id: S.ed.id }, d) : d);

  function htmlCampo(c) {
    const id = "f-" + c.ruta.replace(/\./g, "__");
    if (c.tipo === "bool") return `<label class="check"><input type="checkbox" id="${id}" data-ruta="${c.ruta}"> ${esc(c.label)}</label>`;
    if (c.tipo === "linea" || c.tipo === "letra")
      return `<label for="${id}">${esc(c.label)}</label><input type="text" id="${id}" data-ruta="${c.ruta}" ${c.tipo === "letra" ? 'maxlength="1" class="corto" autocapitalize="characters"' : ""}>`;
    return `<label for="${id}">${esc(c.label)}</label><textarea id="${id}" data-ruta="${c.ruta}" ${c.tipo === "lista" ? 'data-lista="1" rows="5"' : 'rows="3"'}></textarea>`;
  }
  function htmlForm() {
    const grupos = [];
    S.campos.forEach((c) => { let g = grupos.find((x) => x.n === c.grupo); if (!g) grupos.push((g = { n: c.grupo, c: [] })); g.c.push(c); });
    return grupos.map((g, i) => `<details class="grupo" ${i === 0 ? "open" : ""}><summary>${esc(g.n)}</summary>${g.c.map(htmlCampo).join("")}</details>`).join("");
  }
  function llenarForm(d) {
    app.querySelectorAll("[data-ruta]").forEach((el) => {
      const v = leer(d, el.dataset.ruta);
      if (el.type === "checkbox") el.checked = v === true;
      else el.value = Array.isArray(v) ? v.join("\n") : v == null ? "" : v;
    });
  }
  function leerForm() {
    const d = {};
    app.querySelectorAll("[data-ruta]").forEach((el) => poner(d, el.dataset.ruta, el.type === "checkbox" ? el.checked : el.dataset.lista ? el.value.split("\n") : el.value));
    return d;
  }
  const esqueleto = () => { const d = {}; S.campos.forEach((c) => poner(d, c.ruta, c.tipo === "bool" ? false : c.tipo === "lista" ? [] : "")); return d; };

  function vistaEditor(error = "") {
    const e = S.ed, nuevo = !e.id;
    app.innerHTML = `${barra(nuevo ? "Nuevo fármaco" : e.data.nombre_generico || "Fármaco", true)}
      <main class="admin">
        ${error ? `<div class="risk-banner" role="alert">${esc(error)}</div>` : ""}
        <div class="tabs" role="tablist">
          <button type="button" class="tab" role="tab" data-accion="modo" data-modo="form" aria-selected="${e.modo === "form"}">Formulario</button>
          <button type="button" class="tab" role="tab" data-accion="modo" data-modo="json" aria-selected="${e.modo === "json"}">JSON</button>
        </div>
        <p class="ayuda">Separá con <b>;</b> los elementos de una lista (se verán como viñetas) y usá <b>.</b> para cerrar frases.</p>
        ${e.modo === "form" ? htmlForm() : `<label for="json">Fármaco en formato JSON (el id y la fecha los maneja el sistema)</label><textarea id="json" class="json" spellcheck="false" autocapitalize="none">${esc(e.json)}</textarea>`}
        <div class="admin__actions">
          <button type="button" class="btn btn--primary" data-accion="guardar" id="btnGuardar">Guardar</button>
          ${S.rol === "admin" && !nuevo ? '<button type="button" class="btn btn--danger" data-accion="eliminar">Eliminar</button>' : ""}
          <button type="button" class="btn btn--ghost" data-accion="volver">Cancelar</button>
        </div>
      </main>`;
    if (e.modo === "form") llenarForm(e.data);
    window.scrollTo(0, 0);
  }

  function cambiarModo(m) {
    const e = S.ed;
    if (m === e.modo) return;
    if (e.modo === "form") {
      e.data = leerForm();
      e.json = JSON.stringify(conId(e.data), null, 2);
    } else {
      e.json = $("json").value;
      try { e.data = JSON.parse(e.json); } catch (x) { return vistaEditor("El JSON no es válido (" + x.message + "). Corregilo antes de volver al formulario."); }
    }
    e.modo = m;
    vistaEditor();
  }

  async function abrir(id) {
    try {
      const { farmaco } = await api("/api/farmacos?id=" + encodeURIComponent(id));
      S.ed = { id, base: JSON.stringify(farmaco), data: farmaco, json: JSON.stringify(farmaco, null, 2), modo: "form" };
      vistaEditor();
    } catch (x) { if (x.message !== "sesion") alert(x.message); }
  }
  function nuevo() {
    S.ed = { id: null, base: null, data: {}, modo: "form" };
    S.ed.json = JSON.stringify(esqueleto(), null, 2);
    vistaEditor();
  }

  async function guardar() {
    const e = S.ed;
    let d;
    if (e.modo === "form") d = leerForm();
    else {
      e.json = $("json").value;
      try { d = JSON.parse(e.json); } catch (x) { return vistaEditor("El JSON no es válido (" + x.message + ")."); }
    }
    if (!String(d.letra || "").trim()) d.letra = inicial(d.nombre_generico);
    e.data = d;
    if (e.modo === "form") e.json = JSON.stringify(conId(d), null, 2);
    const b = $("btnGuardar"); b.disabled = true; b.textContent = "Guardando…";
    try {
      const j = e.id
        ? await api("/api/farmacos", { method: "PUT", body: { farmaco: Object.assign({}, d, { id: e.id }), base: e.base } })
        : await api("/api/farmacos", { method: "POST", body: { farmaco: d } });
      S.aviso = j.mensaje;
      await cargarLista();
    } catch (x) { if (x.message !== "sesion") vistaEditor(x.message); }
  }

  async function eliminar() {
    const e = S.ed;
    if (!confirm(`¿Eliminar «${e.data.nombre_generico}»?\nSe va a quitar de la app. (Queda el historial en GitHub por si hay que recuperarlo.)`)) return;
    try {
      const j = await api("/api/farmacos?id=" + encodeURIComponent(e.id), { method: "DELETE" });
      S.aviso = j.mensaje;
      await cargarLista();
    } catch (x) { if (x.message !== "sesion") vistaEditor(x.message); }
  }

  // ---------- Eventos ----------
  app.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-accion]");
    if (!b) return;
    const a = b.dataset.accion;
    if (a === "tema") { aplicarTema(TEMAS[(TEMAS.findIndex((t) => t[0] === tema) + 1) % 3][0]); b.textContent = TEMAS.find((t) => t[0] === tema)[1]; }
    else if (a === "salir") { try { await api("/api/sesion", { method: "DELETE" }); } catch (_) {} S.usuario = null; vistaLogin(); }
    else if (a === "volver") cargarLista().catch(() => {});
    else if (a === "nuevo") nuevo();
    else if (a === "abrir") abrir(b.dataset.id);
    else if (a === "modo") cambiarModo(b.dataset.modo);
    else if (a === "guardar") guardar();
    else if (a === "eliminar") eliminar();
  });
  // Al escribir el nombre, se sugiere la letra si todavía está vacía.
  app.addEventListener("change", (ev) => {
    if (ev.target.dataset && ev.target.dataset.ruta === "nombre_generico") {
      const l = app.querySelector('[data-ruta="letra"]');
      if (l && !l.value.trim()) l.value = inicial(ev.target.value);
    }
  });

  api("/api/sesion", { login: true }).then((j) => { S.usuario = j.usuario; S.rol = j.rol; return cargarLista(); }).catch(() => vistaLogin());
})();
