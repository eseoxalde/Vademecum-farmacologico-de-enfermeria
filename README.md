# Vademécum de Enfermería

Vademécum digital desarrollado para uso académico en la cátedra de
Enfermería. Permite consultar fármacos en dos formatos: **ficha técnica**
(información farmacológica completa) y **tarjetas** (resumen orientado a la
práctica de enfermería).

Es un sitio estático (HTML, CSS y JavaScript, sin frameworks ni backend) que
funciona como PWA: se puede instalar en el celular y usarse sin conexión una
vez cargado por primera vez.

## Características

- Búsqueda de fármacos por nombre genérico y navegación por abecedario.
- Ficha técnica completa: farmacodinamia, farmacocinética (ADME),
  indicaciones, contraindicaciones, ajustes renal/hepático, interacciones,
  reacciones adversas, toxicidad y sobredosis, antídotos, monitorización,
  parámetros de valoración, presentaciones, dosis por edad, vías de
  administración, preparación/dilución, velocidad de infusión, estabilidad,
  concentración y alarmas de riesgo.
- Tarjetas resumidas para consulta rápida en la práctica clínica.
- Señalización visual de medicamentos de alto riesgo.
- Secciones plegables (acordeón) para navegar la información más cómodo.
- Diseño mobile-first pensado para consultarse desde el celular.
- Funcionamiento offline mediante Service Worker (PWA instalable).

## Estructura del proyecto

```
├── index.html            → shell de la aplicación
├── manifest.json         → configuración de instalación como app (PWA)
├── service-worker.js      → cachea el sitio y los datos para uso offline
├── css/styles.css
├── js/app.js              → routing, búsqueda y renderizado
├── data/farmacos.json     → base de datos de fármacos
└── icons/                 → íconos de la app
```

## Cómo ejecutarlo localmente

Los navegadores bloquean `fetch()` sobre archivos abiertos con `file://`, así
que hace falta un servidor local simple (no requiere internet):

```bash
python3 -m http.server 8000
```

Y abrir `http://localhost:8000` en el navegador.

## Publicación

Sitio 100% estático: se puede publicar gratis en GitHub Pages, Netlify o
Vercel simplemente sirviendo esta carpeta.

## Aviso importante

Este material fue desarrollado con fines **educativos** para estudiantes de
Enfermería. No reemplaza el criterio clínico profesional, los prospectos
oficiales de cada medicamento ni las guías institucionales vigentes. Ante
cualquier duda en la práctica clínica real, consultar siempre fuentes
oficiales actualizadas y al equipo de salud correspondiente.

## Licencia

Este proyecto está bajo la licencia **Creative Commons
Atribución-NoComercial-SinDerivadas 4.0 Internacional (CC BY-NC-ND 4.0)**.
Ver el archivo [LICENSE](./LICENSE) para el texto completo.

En resumen: se puede compartir citando la fuente, siempre que sea sin fines
comerciales y sin modificar el contenido.
