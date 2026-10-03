# Vademécum Farmacológico de Enfermeria

Aplicación web progresiva para la consulta rápida de información farmacológica durante la práctica profesionalizante de Enfermería.

**Aplicación en línea**: [https://vademecum-farmacologico.vercel.app/](https://vademecum-farmacologico.vercel.app/)

> [!WARNING]
> **Aviso importante**: este material tiene fines **educativos**. No reemplaza el criterio clínico profesional, los prospectos oficiales de cada medicamento ni las guías institucionales vigentes. Ante cualquier duda en la práctica real, se deben consultar fuentes oficiales actualizadas y al equipo de salud correspondiente.

---

## Abstract

**Vademécum Farmacológico de Enfermería** is a Progressive Web App (PWA) designed to provide quick access to pharmacological information during nursing clinical training.

The application allows users to search medications by generic name, active ingredient or pharmacological group, consult detailed technical information or summarized nursing-oriented cards, and access previously loaded content while offline.

The project also includes an administration panel with role-based authentication, a Node.js API and GitHub integration for managing the pharmacological database. A local development mode is available for testing the administration system without modifying the remote repository.

---

## Contexto

El proyecto surge en el marco de la **Tecnicatura Superior en Enfermería**, con el objetivo de desarrollar una herramienta digital que facilite el acceso a la información necesaria para una administración segura de fármacos durante la práctica profesionalizante.

Para una práctica segura es importante conocer la farmacocinética y farmacodinamia de los medicamentos, así como sus efectos adversos, interacciones farmacológicas, rangos de seguridad e incompatibilidades entre soluciones.

También resulta necesario conocer las presentaciones disponibles, vías de administración, preparación y dilución, velocidad de infusión y parámetros de monitoreo antes, durante y después de la administración.

El vademécum concentra y organiza esta información para facilitar su consulta.

Los medicamentos están organizados alfabéticamente según su nombre genérico y se identifican visualmente aquellos considerados **medicamentos de alto riesgo**, de acuerdo con las metas internacionales de seguridad del paciente.

## Objetivo

Brindar acceso fácil y rápido a información farmacológica organizada, especialmente desde dispositivos móviles y en situaciones donde la conectividad puede ser limitada.

---

## Explicación de la aplicación

La aplicación permite consultar los medicamentos en dos formatos:

### Ficha técnica

Presenta información farmacológica completa, organizada en diferentes secciones:

- Farmacodinamia;
- Farmacocinética (ADME);
- Indicaciones;
- Contraindicaciones;
- Precauciones y advertencias;
- Embarazo y lactancia;
- Ajustes renal y hepático;
- Interacciones;
- Reacciones adversas;
- Toxicidad y sobredosis;
- Antídotos;
- Monitorización;
- Parámetros de valoración;
- Presentaciones;
- Dosis por grupo etario;
- Vías de administración;
- Preparación y dilución;
- Velocidad de infusión;
- Estabilidad de soluciones;
- Concentración;
- Alarmas de riesgo;
- Cuidados de enfermería;
- Educación al paciente.

### Tarjetas

Presentan un resumen de la información más relevante para una consulta rápida durante la práctica de Enfermería.

---

## Características

- Búsqueda por nombre genérico, principio activo o grupo farmacológico.
- Búsqueda sin distinguir mayúsculas ni tildes.
- Navegación alfabética.
- Ficha técnica completa.
- Tarjetas resumidas para consulta rápida.
- Identificación visual de medicamentos de alto riesgo.
- Listas con viñetas para facilitar la lectura.
- Secciones plegables mediante acordeón.
- Tema claro, oscuro o automático.
- Indicador de conexión y modo offline.
- Diseño mobile-first.
- PWA instalable en dispositivos compatibles.
- Funcionamiento offline mediante Service Worker.
- Respaldo local de los datos para situaciones de pérdida de conexión.
- Accesibilidad para lectores de pantalla.
- Encabezados y secciones navegables.
- Buscador correctamente etiquetado.
- Avisos sobre cantidad de resultados.
- Foco que acompaña los cambios de pantalla.
- Contraste adecuado en ambos temas.
- Respeto de la preferencia de reducción de movimiento.

---

## Tecnologías utilizadas

### Frontend

- HTML5
- CSS3
  - Variables CSS;
  - Diseño responsive;
  - Enfoque mobile-first;
  - Temas claro y oscuro;
  - Sin frameworks.
- JavaScript vanilla - Sin frameworks; - Sin librerías externas.

### Backend

- Node.js
- API para operaciones sobre los datos farmacológicos.
- Autenticación mediante sesiones firmadas.
- Validación de datos.
- Control de acceso mediante roles

### Datos

La información farmacológica se almacena en:
`data/farmacos.json`

El archivo contiene los datos estructurados de cada medicamento, incluyendo campos simples, objetos anidados y listas como cuidados de enfermería y educación al paciente.

### PWA y funcionamento offline

La aplicación utiliza:

- **Service Worker** para gestionar la caché.
- **Web App Manifest** para permitir la instalación como aplicación.
- **localStorage** para conservar información local y preferencias.

El Service Worker utiliza una estrategia que prioriza la red para obtener datos actualizados cuando existe conexión y permite utilizar los recursos almacenados localmente cuando no hay conexión.

### Arquitectura

La interfaz funciona como una **Single Page Application (SPA)** con navegación mediante hash:

```
#/
#/ficha/...
#/tarjetas/...
```

La aplicación principal se ejecuta en el navegador, mientras que el backend proporciona las operaciones necesarias para la administración y actualización de los datos.

---

## Panel de administración

El proyecto incorpora un panel de administración disponible en : `/admin/`
El panel permite gestionar los medicamentos sin editar manualmente `farmacos.json`.
La API valida los datos antes de guardarlos y utiliza roles para controlar el acceso.

### Roles

`admin` Usuario con acceso completo a las funciones de administración.
`editor` Usuario destinado a las funciones de edición permitidas por el sistema.

---

## Autenticación

La autenticación utiliza sesiones firmadas mediante un secreto configurado en el entorno de ejecución.

En producción, las contraseñas se almacenan mediante hash scrypt y no como texto plano.

Para generar un hash:
`node tools/hash-password.js "tu-clave"`
El resultado se utiliza en la configuración del usuario.
Ejemplo:

```
[ { "usuario": "ana", "rol": "admin", "clave": "scrypt$..." } ]
```

Las credenciales reales no deben incorporarse al repositorio.

---

## Persistencia de datos

El sistema utiliza dos modos de funcionamiento.

### Desarrollo local

El servidor local activa automáticamente el modo de prueba:
`node tools/servidor-local.js`
En este modo, los cambios realizados desde el panel se guardan directamente en `data/farmacos.json`
Esto permite desarrollar y probar el ABM sin realizar modificaciones en GitHub.

### Producción

En producción, la API utiliza la **GitHub API** para leer y actualizar el archivo:

`data/farmacos.json`

Los cambios realizados desde el panel se guardan mediante commits en el repositorio configurado.

El sistema también contempla conflictos de escritura para evitar sobrescribir cambios realizados simultáneamente.

---

## Variables de entorno

Las credenciales y secretos utilizados en producción se configuran mediante variables de entorno.

`AUTH_SECRET`

Se utiliza para firmar las sesiones.

Debe tener al menos 16 caracteres y se recomienda utilizar un valor aleatorio y seguro.

`GITHUB_TOKEN`

Token utilizado por la API para realizar las operaciones necesarias sobre el repositorio.
Se recomienda utilizar un Fine-grained Personal Access Token, restringido al repositorio correspondiente y únicamente a los permisos necesarios.

`ABM_USUARIOS`

Contiene la configuración de los usuarios autorizados, sus roles y los hashes de sus contraseñas.

Los valores reales de estas variables no deben publicarse en el repositorio.

---

## Instalación y uso

### Requisitos

Para ejecutar el proyecto localmente se necesita:

- Node.js
- Git
- un navegador web moderno.

### Clonar el repositorio

```
git clone https://github.com/eseoxalde/Vademecum-farmacologico-de-enfermeria.git cd Vademecum-farmacologico-de-enfermeria
```

### Ejecutar la aplicación

Para utilizar únicamente la aplicación frontend se puede iniciar un servidor HTTP local.

Por ejemplo:

`python3 -m http.server 8000`

Luego abrir:

`http://localhost:8000`

También puede utilizarse:

`npx serve`

Los navegadores bloquean determinadas operaciones de la aplicación cuando los archivos se abren directamente mediante `file://`, por lo que se recomienda utilizar un servidor local.

---

## Ejecutar el panel de administración

Para probar la API y el panel de administración en modo local:

`node tools/servidor-local.js`

El servidor mostrará:

`App: http://localhost:8000`
`ABM: http://localhost:8000/admin/`

### Usuarios de prueba

El modo local incluye dos usuarios de prueba:

`admin / demo`
`editor / demo`

Estas credenciales son exclusivamente para desarrollo local y no corresponden a los usuarios de producción.

Los cambios realizados en este modo se escriben directamente en:

`data/farmacos.json`

---

### Instalación como PWA

Desde un navegador compatible, la aplicación puede instalarse utilizando la opción correspondiente del navegador, por ejemplo:

**Agregar a pantalla de inicio o Instalar aplicación.**

Una vez instalada, puede utilizarse como una aplicación independiente.

---

## Pruebas

El proyecto contempla pruebas funcionales de los principales componentes de la aplicación.

---

## Consulta

Se verifica:

- Búsqueda de medicamentos;
- Búsqueda por principio activo;
- Búsqueda por grupo farmacológico;
- Navegación por abecedario;
- Apertura de fichas;
- Visualización de tarjetas;
- Navegación entre secciones;
- Visualización de listas;
- Ocultamiento de campos vacíos;
- Identificación de medicamentos de alto riesgo.

## PWA y modo offline

Se verifica:

- Carga inicial de la aplicación;
- Almacenamiento de recursos mediante Service Worker;
- Acceso a la información previamente cargada sin conexión;
- Recuperación de datos actualizados cuando existe conexión;
- Funcionamiento del indicador de estado de conexión;
- Instalación como PWA.

## Accesibilidad

Se realizan comprobaciones con:

- Navegación mediante teclado;
- Lector de pantalla;
- Foco durante los cambios de pantalla;
- Etiquetas de controles;
- Contraste;
- Reducción de movimiento.

## Panel de administración

Se verifica:

- Inicio de sesión;
- Cierre de sesión;
- Validación de credenciales;
- Diferenciación entre roles;
- Alta de medicamentos;
- Edición de medicamentos;
- Validación de datos;
- Gestión de listas;
- Persistencia de cambios.

## Modo local

Se comprueba que:

- El servidor se inicie correctamente;
- La aplicación esté disponible en localhost;
- El panel sea accesible;
- Funcionen los usuarios de prueba;
- Los cambios se escriban en data/farmacos.json.

## Producción

Se verifica la integración entre:

Frontend
↓
API
↓
GitHub API
↓
data/farmacos.json

También se contempla el manejo de errores ante:

- Variables de entorno faltantes;
- Credenciales inválidas;
- Datos incorrectos;
- Errores de comunicación con GitHub;
- Conflictos de escritura.

---

## Estructura del proyecto

Vademecum-farmacologico-de-enfermeria/
│
├── admin/
│ ├── admin.css
│ ├── admin.js
│ └── index.html
│
├── api/
│ ├── \_lib.js
│ ├── farmacos.js
│ └── sesion.js
│
├── css/
│ └── styles.css
│
├── data/
│ └── farmacos.json
│
├── icons/
│ ├── icon-192.png
│ └── icon-512.png
│
├── js/
│ └── app.js
│
├── tools/
│ ├── hash-password.js
│ └── servidor-local.js
│
├── index.html
├── manifest.json
├── service-worker.js
├── .gitignore
└── README.md

---

## Cómo cargar los datos

La información farmacológica se almacena en:

`data/farmacos.json`

La estructura general es:

{
"version": "1",
"actualizado": "2026-08-06",
"farmacos": [
{}
]
}

Los datos incluyen:

- `id`
- `nombre_generico`
- `letra`
- `alto_riesgo`
- información farmacodinámica;
- información farmacocinética;
- indicaciones;
- contraindicaciones;
- dosis;
- vías de administración;
- preparación;
- monitorización;
- cuidados de enfermería;
- educación al paciente;
- entre otros.

El panel de administración permite gestionar estos datos sin necesidad de editar manualmente el JSON.

### Listas

Los campos que contienen listas, como cuidados de enfermería, utilizan arrays:

"cuidados_enfermeria": {
"cuidados": [
"Primer cuidado",
"Segundo cuidado"
],
"educacion_paciente": [
"Primera recomendación",
"Segunda recomendación"
]
}

En otros campos de texto, el carácter ; puede utilizarse para separar elementos que la aplicación mostrará como viñetas.

---

## Alcance y limitaciones

Los fármacos cargados fueron investigados por estudiantes utilizando como fuente los prospectos elaborados por los laboratorios.

El contenido es revisado y aprobado por la cátedra antes de su publicación.

La aplicación tiene fines educativos y no sustituye fuentes oficiales ni el criterio profesional.

La información disponible depende de la actualización de los datos incluidos en el proyecto.

El funcionamiento offline depende de que los recursos hayan sido cargados previamente en el dispositivo.

La información farmacológica no debe utilizarse como única fuente para tomar decisiones clínicas.

---

## Hoja de ruta

Finalizads:

- Consulta de medicamentos.
- Fichas técnicas.
- Tarjetas para consulta rápida.
- Búsqueda y navegación alfabética.
- Modo oscuro.
- PWA instalable.
- Funcionamiento offline.
- Panel de administración.
- Autenticación y roles.
- API para gestión de medicamentos.
- Modo local para desarrollo.
- Integración con GitHub para persistencia de datos.

En proceso

- Validación automática del formato mediante JSON Schema.
- Integración de validaciones automáticas mediante GitHub - Actions.
- Favoritos.
- Historial de medicamentos consultados.
- Aviso de nuevas versiones.
- Mejoras adicionales de accesibilidad.
- Empaquetado como aplicación para tiendas.

## Autoría

Proyecto académico desarrollado en el marco de la: **Escuela de Gobierno en Salud Floreal Ferrara – Región Sanitaria XII**

**Carrera**: Tecnicatura Superior en Enfermería
**Asignatura**: Farmacología en Enfermería
**Autoría del contenido**: Lic. Alejandra Guerrero
**Desarrollo**: Ese Kai Oxalde
**Año**: 2026

---

## Licencia y uso

El proyecto contiene dos tipos de material con condiciones de uso diferentes:

### Contenido farmacológico

Los datos farmacológicos, textos e imágenes pertenecientes al trabajo académico se encuentran sujetos a las condiciones de uso establecidas por la cátedra y sus correspondientes titulares.

El contenido no debe modificarse, redistribuirse ni utilizarse con fines comerciales sin la autorización correspondiente.

### Código fuente

El código fuente desarrollado para la aplicación es propiedad de sus respectivos autores y titulares.

No se autoriza la reproducción, modificación o redistribución del código sin autorización previa, salvo que exista una autorización expresa aplicable.

---

## Recursos

- [Repositorio en GitHub](https://github.com/eseoxalde/Vademecum-farmacologico-de-enfermeria)
- [Aplicación en línea](https://vademecum-farmacologico.vercel.app/)
- [Deployments](https://github.com/eseoxalde/Vademecum-farmacologico-de-enfermeria/deployments)

---

## Contacto

Para consultas relacionadas con la aplicación:

ese.oxalde@gmail.com
