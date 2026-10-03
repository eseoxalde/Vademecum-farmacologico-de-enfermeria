// Servidor de prueba: sirve el sitio y el ABM en http://localhost:8000
// El ABM edita directamente data/farmacos.json (sin GitHub). Usuarios de prueba: admin/demo y editor/demo.
// Uso: node tools/servidor-local.js
process.env.ABM_LOCAL = "1";
const http = require("http"), fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, "..");
const PUERTO = process.env.PORT || 8000;
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    let fn;
    try { fn = require(path.join(RAIZ, "api", url.pathname.slice(5).replace(/[^a-z]/g, "") + ".js")); }
    catch (_) { res.statusCode = 404; return res.end("No existe"); }
    const partes = []; for await (const c of req) partes.push(c);
    const t = Buffer.concat(partes).toString();
    try { req.body = t ? JSON.parse(t) : {}; } catch (_) { req.body = {}; }
    req.query = Object.fromEntries(url.searchParams);
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
    return fn(req, res);
  }
  let archivo = path.join(RAIZ, path.normalize(decodeURIComponent(url.pathname)));
  if (!archivo.startsWith(RAIZ)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) {
    if (!url.pathname.endsWith("/")) { res.statusCode = 301; res.setHeader("Location", url.pathname + "/"); return res.end(); }
    archivo = path.join(archivo, "index.html");
  }
  fs.readFile(archivo, (e, d) => {
    if (e) { res.statusCode = 404; return res.end("No encontrado"); }
    res.setHeader("Content-Type", TIPOS[path.extname(archivo)] || "application/octet-stream");
    res.end(d);
  });
}).listen(PUERTO, () => console.log(`App:  http://localhost:${PUERTO}\nABM:  http://localhost:${PUERTO}/admin/   (admin/demo · editor/demo)`));
