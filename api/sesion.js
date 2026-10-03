// GET: quién soy · POST: iniciar sesión · DELETE: cerrar sesión
const L = require("./_lib");

module.exports = L.envolver(async (req, res) => {
  if (req.method === "GET") {
    const s = L.sesion(req);
    return res.status(200).json({ usuario: s.u, rol: s.r });
  }
  L.mismoOrigen(req);
  if (req.method === "POST") {
    const { usuario, clave } = req.body || {};
    const u = L.usuarios().find((x) => x.usuario === String(usuario || "").trim());
    if (!u || !L.verificarClave(String(clave || ""), u.clave)) {
      await new Promise((r) => setTimeout(r, 800)); // frena los intentos repetidos
      throw new L.ErrHttp(401, "Usuario o contraseña incorrectos.");
    }
    const seg = L.HORAS * 3600;
    res.setHeader("Set-Cookie", L.cookie(L.firmar({ u: u.usuario, r: u.rol, exp: Date.now() + seg * 1000 }), seg));
    return res.status(200).json({ usuario: u.usuario, rol: u.rol });
  }
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", L.cookie("", 0));
    return res.status(200).json({ ok: true });
  }
  throw new L.ErrHttp(405, "Método no permitido.");
});
