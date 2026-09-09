# Vademécum de Enfermería

Vademécum digital desarrollado para uso académico en la cátedra de
Enfermería. Permite consultar fármacos en dos formatos: **ficha técnica**
(información farmacológica completa) y **tarjetas** (resumen orientado a la
práctica de enfermería).

Es un sitio estático (HTML, CSS y JavaScript, sin frameworks ni backend) que
funciona como PWA: se puede instalar en el celular y usarse sin conexión una
vez cargado por primera vez.

## Autoría

Desarrollado por estudiantes de la cátedra de Enfermería como proyecto
académico.

- **Institución:** [Escuela de gobierno en salud Floreal Ferrara - Región Sanitaria XII]
- **Carrera:** [Tecnicatura superior en Enfermería]
- **Asignatura:** [Farmacología en enfermería]
- **Autores:** [Lic. Alejandra Guerrero]
- **Desarrollo:** [Ese Kai Oxalde]
- **Año:** 2026

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

## Tecnologías utilizadas

### Frontend

- HTML5
- CSS3 (variables CSS, diseño responsive mobile-first, sin frameworks)
- JavaScript (vanilla, sin frameworks ni librerías externas)

### Arquitectura

- Single Page Application (SPA) con ruteo por hash (#/...), sin necesidad de backend
- JSON como base de datos (data/farmacos.json)

### Offline / PWA

- Service Worker (cacheo de la app y de los datos para uso sin conexión)
- Web App Manifest (manifest.json) para instalación como app en el celular
  localStorage como respaldo de datos si falla la conexión

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

## Alcance y limitaciones

- Los fármacos actualmente cargados fueron investigados por los mismos
  estudiantes, utilizando los prospectos elaborados por los laboratorios
  como fuente.
- La carga de datos se hace directamente sobre el archivo `data/farmacos.json`;
  queda pendiente desarrollar una pantalla de carga integrada al sitio.
- Uno de los objetivos principales del proyecto es que se pueda acceder desde
  el celular, con el menor uso de datos posible, además de contemplar el
  poco espacio de almacenamiento disponible en los dispositivos (queda
  pendiente empaquetarlo como app).

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

## Contribuciones

Dado que la licencia es "Sin Derivadas", no se aceptan forks ni pull
requests con modificaciones de terceros. Para sugerencias, correcciones o
reporte de errores en el contenido, contactar directamente a la cátedra.
