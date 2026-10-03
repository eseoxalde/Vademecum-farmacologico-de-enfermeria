// GET: lista (o un fármaco con ?id=) · POST: alta (admin) · PUT: modificar (admin y editor) · DELETE: baja (admin)
const L = require("./_lib");

const AVISO = L.LOCAL
  ? "Guardado en el archivo local data/farmacos.json."
  : "Guardado. En la app pública se verá en aproximadamente 1 minuto.";

module.exports = L.envolver(async (req, res) => {
  const ses = L.sesion(req);
  const esAdmin = ses.r === "admin";
  if (req.method !== "GET") L.mismoOrigen(req);

  if (req.method === "GET") {
    const { datos } = await L.leerArchivo();
    const id = req.query && req.query.id;
    if (id) {
      const f = datos.farmacos.find((x) => x.id === String(id));
      if (!f) throw new L.ErrHttp(404, "No se encontró el fármaco.");
      return res.status(200).json({ farmaco: f });
    }
    const resumen = datos.farmacos.map((f) => ({ id: f.id, nombre_generico: f.nombre_generico, letra: f.letra, alto_riesgo: !!f.alto_riesgo }));
    return res.status(200).json({ usuario: ses.u, rol: ses.r, campos: L.CAMPOS, farmacos: resumen });
  }

  const cuerpo = req.body || {};

  if (req.method === "POST") {
    if (!esAdmin) throw new L.ErrHttp(403, "Solo el administrador puede agregar fármacos.");
    const nuevo = L.validar(cuerpo.farmaco);
    await L.modificar((d) => {
      if (d.farmacos.some((x) => x.nombre_generico.toLowerCase() === nuevo.nombre_generico.toLowerCase()))
        throw new L.ErrHttp(409, "Ya existe un fármaco con ese nombre.");
      const id = String(d.farmacos.reduce((m, x) => Math.max(m, parseInt(x.id, 10) || 0), 0) + 1);
      d.farmacos.push({ id, ...nuevo });
      return { mensaje: `ABM: agrega «${nuevo.nombre_generico}» (${ses.u})` };
    });
    return res.status(200).json({ ok: true, mensaje: AVISO });
  }

  if (req.method === "PUT") {
    const id = String((cuerpo.farmaco || {}).id || "");
    const nuevo = L.validar(cuerpo.farmaco);
    await L.modificar((d) => {
      const i = d.farmacos.findIndex((x) => x.id === id);
      if (i < 0) throw new L.ErrHttp(404, "El fármaco ya no existe.");
      if (JSON.stringify(d.farmacos[i]) !== cuerpo.base)
        throw new L.ErrHttp(409, "Otra persona modificó este fármaco mientras lo editabas. Volvé a abrirlo para ver los cambios.");
      d.farmacos[i] = { id, ...nuevo };
      return { mensaje: `ABM: modifica «${nuevo.nombre_generico}» (${ses.u})` };
    });
    return res.status(200).json({ ok: true, mensaje: AVISO });
  }

  if (req.method === "DELETE") {
    if (!esAdmin) throw new L.ErrHttp(403, "Solo el administrador puede eliminar fármacos.");
    const id = String((req.query && req.query.id) || "");
    await L.modificar((d) => {
      const i = d.farmacos.findIndex((x) => x.id === id);
      if (i < 0) throw new L.ErrHttp(404, "El fármaco ya no existe.");
      const [borrado] = d.farmacos.splice(i, 1);
      return { mensaje: `ABM: elimina «${borrado.nombre_generico}» (${ses.u})` };
    });
    return res.status(200).json({ ok: true, mensaje: AVISO });
  }

  throw new L.ErrHttp(405, "Método no permitido.");
});
