# Vademecum Farmacológico de Enfermería

> 🔗 **Aplicación en línea:** https://vademecum-farmacologico.vercel.app

Herramienta digital de consulta rápida para la administración segura de fármacos durante la práctica profesionalizante de Enfermería. Se puede instalar en el celular y usar sin conexión una vez cargada por primera vez.

> ⚠️ **Aviso importante:** este material tiene fines **educativos**. No reemplaza el criterio clínico profesional, los prospectos oficiales de cada medicamento ni las guías institucionales vigentes. Ante cualquier duda en la práctica real, consultar siempre fuentes oficiales actualizadas y al equipo de salud correspondiente.

<!-- Agregar capturas de pantalla: inicio, listado, ficha técnica, tarjeta, modo oscuro y panel de administración -->

---

## Objetivo

Brindar acceso fácil y rápido a la información necesaria para la administración segura de fármacos durante la práctica profesionalizante.

## Fundamento

Para una práctica segura de administración de fármacos es importante conocer su farmacocinética y farmacodinamia, ya que se utilizan para el tratamiento de alteraciones de la salud, siempre bajo indicación médica. Se requiere un conocimiento cabal de sus efectos adversos, interacciones farmacológicas, rangos de seguridad e incompatibilidades entre soluciones, así como de los tipos de presentaciones, las vías de administración recomendadas y el control de la infusión.

Toda esta información se encuentra concentrada y organizada en esta aplicación, junto con datos para el monitoreo antes, durante y después de la administración.

Los fármacos están ordenados alfabéticamente por nombre genérico y se etiquetan los **medicamentos de alto riesgo**, según las metas internacionales de seguridad del paciente.

## ¿Cómo funciona?

Permite consultar cada fármaco en dos formatos:

- **Ficha técnica:** información farmacológica completa.
- **Tarjetas:** resumen orientado a la práctica de enfermería.

La aplicación pública es un sitio estático (HTML, CSS y JavaScript, sin frameworks ni backend) que funciona como PWA. El contenido se administra desde un [panel aparte (ABM)](#panel-de-administración-abm) protegido con usuario y contraseña.

## Características

- Búsqueda por nombre genérico, principio activo o grupo farmacológico (por ejemplo, "anticoagulantes"), sin distinguir tildes ni mayúsculas, y navegación por abecedario.
- Ficha técnica completa: farmacodinamia, farmacocinética (ADME), indicaciones, contraindicaciones, ajustes renal/hepático, interacciones, reacciones adversas, toxicidad y sobredosis, antídotos, monitorización, parámetros de valoración, presentaciones, dosis por edad, vías de administración, preparación/dilución, velocidad de infusión, estabilidad, concentración y alarmas de riesgo.
- Tarjetas resumidas para consulta rápida en la práctica clínica, con cuidados de enfermería y educación al paciente.
- Señalización visual de medicamentos de alto riesgo.
- Información en listas con viñetas para leerla más fácil (ver [Cómo cargar los datos](#cómo-cargar-los-datos-en-el-json)).
- Secciones plegables (acordeón).
- Tema claro, oscuro o automático (según el celular), a elección de cada persona desde el botón de la barra superior.
- Indicador de conexión ("En línea" / "Sin conexión · modo offline").
- Diseño *mobile-first*, pensado para consultarse desde el celular.
- Funcionamiento sin conexión mediante Service Worker (PWA instalable).
- Accesibilidad para lectores de pantalla: encabezados y secciones navegables, buscador con etiqueta, filtros que informan su estado, aviso de cantidad de resultados, foco que acompaña los cambios de pantalla, buen contraste en ambos temas y respeto de la preferencia de reducir animaciones.
- Panel de administración (ABM) con usuarios, roles y carga por formulario o por JSON.

## Tecnologías utilizadas

**Frontend**
- HTML5
- CSS3 (variables CSS, diseño responsive *mobile-first*, temas claro/oscuro, sin frameworks)
- JavaScript vanilla (sin frameworks ni librerías externas)

**Arquitectura**
- Single Page Application (SPA) con ruteo por hash (`#/...`), sin necesidad de backend.
- JSON como base de datos (`data/farmacos.json`), cargado y consultado en el dispositivo.

**Offline / PWA**
- Service Worker: los datos (`farmacos.json`) se piden primero a la red, para mostrar siempre la información más reciente si hay conexión; el resto de los archivos se sirve al instante desde la caché y se actualiza en segundo plano. El panel de administración y su API nunca se cachean.
- Web App Manifest (`manifest.json`): permite instalarla como app en el celular.
- `localStorage`: respaldo de los datos si falla la conexión, y guarda el tema elegido.

**Panel de administración (ABM)**
- Funciones *serverless* de Vercel en Node.js (carpeta `api/`), sin dependencias externas.
- Sesión con cookie firmada, claves con `scrypt`, y guardado de los cambios mediante la API de GitHub.

**Publicación**
- Hosting en Vercel, desplegado desde la rama `main`.

## Estructura del proyecto

```
├── index.html             → shell de la aplicación
├── manifest.json          → configuración de instalación como app (PWA)
├── service-worker.js      → cachea el sitio y los datos para uso offline
├── css/styles.css         → estilos y temas
├── js/app.js              → ruteo, búsqueda, tema y renderizado
├── data/farmacos.json     → base de datos de fármacos
├── icons/                 → íconos de la app
├── admin/                 → pantalla del panel de administración (ABM)
├── api/                   → servidor del ABM (login y guardado en GitHub)
└── tools/                 → utilidades: generar claves y probar el ABM en local
```

## Ejecución local

Los navegadores bloquean `fetch()` sobre archivos abiertos con `file://`, por lo que hace falta un servidor local simple. Para ver solo la app sirve cualquiera de estos, ejecutado dentro de la carpeta del proyecto:

```bash
python3 -m http.server 8000     # Python
npx serve                       # Node
```

Para probar también el panel de administración, usar `node tools/servidor-local.js` (ver [Probarlo en la computadora](#probarlo-en-la-computadora)).

Si después de un cambio se sigue viendo la versión anterior, es por la caché del Service Worker: hacer una recarga forzada (`Ctrl + Shift + R`) o, en las herramientas de desarrollador, *Application → Service Workers → Unregister*.

## Cómo cargar los datos en el JSON

Toda la información está en `data/farmacos.json`. Se puede editar directamente este archivo o usar el [panel de administración](#panel-de-administración-abm). El archivo tiene tres partes:

```json
{
  "version": 1,
  "actualizado": "2026-08-06",
  "farmacos": [ { ... }, { ... } ]
}
```

- `version` y `actualizado` (formato `AAAA-MM-DD`) se muestran en el pie de la app. El panel actualiza la fecha solo; si se edita el archivo a mano, **actualizarla cada vez que se modifica el contenido**.
- Cada fármaco tiene un `id` único, `nombre_generico`, `letra` (la del abecedario donde debe aparecer), `alto_riesgo` (`true` o `false`) y el resto de los campos de la ficha. Los campos agrupados (como `dosis` o `cuidados_enfermeria`) son objetos con sus propios subcampos. Las excepciones son `cuidados_enfermeria.cuidados` y `cuidados_enfermeria.educacion_paciente`, que son **listas** (`["Primer cuidado.", "Segundo cuidado."]`): cada elemento se muestra como una viñeta, sin necesidad de usar `;`.
- Un campo vacío (`""`) no se muestra, y si todos los campos de una sección están vacíos, la sección completa se oculta.

### Uso del punto y coma (`;`) y del punto (`.`)

La app transforma el texto de cada campo según la puntuación:

| Si escribís… | La app muestra… |
|---|---|
| `"Hemorragias; Necrosis cutánea; Alopecia"` | Una **lista con viñetas**, una por cada elemento separado por `;` |
| `"Hemorragias."` o `"Hemorragias;"` | Un texto simple (con un solo elemento no hay lista) |
| `"Tratamiento del dolor. Uso bajo indicación médica."` | Un **párrafo corrido** (el punto no genera viñetas) |
| `"Extender intervalo (Ccr < 50: c/8-12h; Ccr < 10: c/12-24h)"` | **Un solo elemento**: el `;` dentro de paréntesis se ignora |

**Reglas prácticas**

1. **Usar `;` para separar elementos independientes** de una lista: efectos adversos, contraindicaciones, antídotos, interacciones, presentaciones, etc. Cada elemento será una viñeta.
2. **Usar `.` para terminar frases** o separar oraciones dentro de un mismo texto. El punto no tiene ningún efecto especial: solo se muestra como parte del texto.
3. **No usar `.` para separar elementos de una lista**, porque entonces quedan todos juntos en un párrafo.
4. **No hace falta cerrar la lista** con `;` ni con `.` al final; si queda, no se ve.
5. **Si una frase tiene un `;` que no es una lista**, por ejemplo `"Rápida vía oral; biodisponibilidad 25%"`, se va a dividir en dos viñetas. En ese caso conviene reemplazarlo por un punto o una coma.
6. **Las comas no tienen efecto**: se pueden usar libremente dentro de cada elemento.
7. **Las citas numéricas** (como `[17]` o `[26, 27]`) se muestran como texto. Si van al final de un campo con varios elementos, quedan pegadas a la última viñeta, aunque valgan para todo el campo. Si corresponden a un solo elemento, ponerlas justo después de ese elemento.
8. **No se interpreta HTML**: caracteres como `<` o `>` se muestran tal cual (por ejemplo, `Ccr < 50`).

## Panel de administración (ABM)

Permite agregar, modificar y eliminar fármacos sin tocar el código. Está en `/admin/` (por ejemplo, `https://vademecum-farmacologico.vercel.app/admin/`), se usa bien desde el celular y tiene modo claro/oscuro.

**Roles**

| Rol | Puede |
|---|---|
| **Administrador** | Agregar, modificar y eliminar fármacos |
| **Editor** | Solo modificar fármacos existentes |

**Dos formas de cargar un fármaco** (se puede cambiar de una a otra en cualquier momento):

- **Formulario:** un campo por cada dato, agrupados en secciones plegables. Es la forma recomendada. Al escribir el nombre sugiere la letra. En los campos de cuidados, cada línea es un elemento de la lista.
- **JSON:** se edita (o pega) el fármaco completo en formato JSON, con las mismas reglas de [esta sección](#cómo-cargar-los-datos-en-el-json). El `id` y la fecha de actualización los maneja el sistema.

**¿Cómo se guardan los cambios?** Cada guardado crea un *commit* en este repositorio (por ejemplo, `ABM: modifica «Furosemida» (ana)`), así que queda el historial de quién cambió qué y se puede deshacer. Vercel vuelve a publicar la app automáticamente: **los cambios se ven en la app pública en aproximadamente 1 minuto**. El panel, en cambio, siempre muestra lo último guardado. Si dos personas editan el mismo fármaco a la vez, el sistema avisa en lugar de pisar los cambios.

### Configuración (una sola vez)

1. **Token de GitHub:** en GitHub, *Settings → Developer settings → Personal access tokens → Fine-grained tokens*. Crear uno limitado **solo a este repositorio**, con el permiso *Contents: Read and write*.
2. **Crear las claves** de cada persona (mínimo 8 caracteres), en una terminal, dentro del proyecto:

   ```bash
   node tools/hash-password.js "la-clave-de-ana"
   ```

   Devuelve un texto que empieza con `scrypt$...`: es la clave encriptada. **La clave real no se guarda en ningún lado.**
3. **Cargar las variables en Vercel** (*Project → Settings → Environment Variables*):

   | Variable | Valor |
   |---|---|
   | `GITHUB_TOKEN` | El token del paso 1 |
   | `AUTH_SECRET` | Un texto largo y aleatorio (mínimo 16 caracteres). Se puede generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `ABM_USUARIOS` | La lista de usuarios, en una sola línea (ver abajo) |
   | `GITHUB_REPO` | *(opcional)* Por defecto `eseoxalde/vademecum` |
   | `GITHUB_BRANCH` | *(opcional)* Por defecto `main` |

   Ejemplo de `ABM_USUARIOS`:

   ```json
   [{"usuario":"ana","rol":"admin","clave":"scrypt$..."},{"usuario":"luis","rol":"editor","clave":"scrypt$..."}]
   ```

4. **Volver a publicar** el proyecto en Vercel (*Deployments → Redeploy*) para que tome las variables.

Para **cambiar una clave o agregar/quitar a alguien**, se genera el texto nuevo con `hash-password.js`, se edita `ABM_USUARIOS` en Vercel y se vuelve a publicar.

### Probarlo en la computadora

```bash
node tools/servidor-local.js
```

Abre la app en `http://localhost:8000` y el panel en `http://localhost:8000/admin/`, con los usuarios de prueba `admin` / `demo` y `editor` / `demo`. **En este modo el panel modifica directamente tu archivo `data/farmacos.json`** (no usa GitHub), así que conviene revisar los cambios con `git diff` antes de subirlos. Este modo de prueba no funciona en Vercel.

### Seguridad

- Los permisos y la validación de los datos se controlan **en el servidor**, no en la pantalla.
- Las claves se guardan encriptadas (`scrypt`), la sesión dura 8 horas y se guarda en una cookie firmada que el navegador no deja leer desde JavaScript.
- El token de GitHub existe solo en Vercel, nunca en el código.
- Cada intento de ingreso fallido se demora casi un segundo, pero no hay bloqueo de cuentas: usar claves largas y distintas para cada persona.
- El panel no se muestra en buscadores (`noindex`), pero su dirección es pública: la protección es el usuario y la contraseña.
- Si se activa la protección de la rama `main` en GitHub, **no exigir *pull requests***: el panel guarda con *commits* directos y quedaría bloqueado.

## Alcance y limitaciones

- Los fármacos cargados fueron investigados por los estudiantes, utilizando como fuente los prospectos elaborados por los laboratorios.
- Todo el contenido es revisado y aprobado por la cátedra antes de publicarse.
- La carga y modificación de datos está reservada a la cátedra y al equipo de desarrollo autorizado, a través del panel de administración o directamente en `data/farmacos.json`.

## Hoja de ruta

- [ ] Revisión general del contenido de `farmacos.json` (ortografía y uso de `;` y `.`).
- [ ] Validación automática del formato de `farmacos.json` (JSON Schema + GitHub Actions).
- [ ] Favoritos y fármacos consultados recientemente.
- [ ] Aviso dentro de la app cuando haya una nueva versión disponible.
- [ ] Empaquetado como app para tiendas (PWABuilder / TWA).

## Autoría

Proyecto académico desarrollado en el marco de la cátedra.

- **Institución:** Escuela de Gobierno en Salud Floreal Ferrara – Región Sanitaria XII
- **Carrera:** Tecnicatura Superior en Enfermería
- **Asignatura:** Farmacología en Enfermería
- **Autoría del contenido:** Lic. Alejandra Guerrero
- **Desarrollo:** Ese Kai Oxalde
- **Año:** 2026

## Licencia y uso

Este proyecto **no admite modificaciones ni derivados sin el consentimiento expreso de la cátedra**.

- **Contenido** (datos farmacológicos, textos e imágenes): [Creative Commons Atribución-NoComercial-SinDerivadas 4.0 Internacional (CC BY-NC-ND 4.0)](./LICENSE). Se puede compartir citando la fuente, sin fines comerciales y sin modificar el contenido.
- **Código fuente:** Copyright © 2026 Ese Kai Oxalde y la cátedra. Todos los derechos reservados. Queda prohibida su copia, modificación o redistribución sin autorización previa por escrito.

## Contribuciones

No se aceptan *pull requests*, *forks* con modificaciones ni cambios de terceros. Para sugerencias, correcciones o reportes de errores en el contenido, comunicarse directamente con la cátedra.
