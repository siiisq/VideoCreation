# Renderizar en un PC con Windows (con GPU)

Los scripts (`npm run reel`, `npm run render`) funcionan igual en Windows que en el contenedor Linux:
`scripts/platform.mjs` elige solo las rutas y el modo gráfico. En Windows Remotion usa `--gl=angle`, que tira de la
GPU real (Direct3D), así que el render es bastante más rápido que en el contenedor.

## 1. Instalar (una vez)
Abre **PowerShell** y ejecuta:
```powershell
winget install Git.Git OpenJS.NodeJS.LTS Python.Python.3.12 Gyan.FFmpeg
```
Cierra y vuelve a abrir PowerShell para que se carguen las rutas. Comprueba con `node -v`, `python --version`, `ffmpeg -version`.
(No hace falta instalar Chrome: Remotion descarga el suyo la primera vez.)

## 2. Clonar el repo e instalar dependencias
Usa una carpeta sin espacios ni tildes, por ejemplo `C:\proyectos`:
```powershell
cd C:\proyectos
git clone https://github.com/siiisq/videocreation.git
cd videocreation
npm ci
cd experiments\hyperframes; npm ci; cd ..\..
```

## 3. Clave de voz (en TU PC; nunca la pegues en el chat)
```powershell
setx GEMINI_API_KEY "tu-clave"
```
Cierra y abre PowerShell otra vez. (O `GOOGLE_TTS_API_KEY` si usas Google Cloud TTS.)
El entorno de Python (`.venv`) se crea solo la primera vez que lanzas un reel.

## 4. Renderizar
```powershell
git pull
npm run reel -- videos/dinero-parado.json
```
Resultado: `out\dinero-parado.mp4` (máster 60 fps) y `out\dinero-parado.movil.mp4` (el que se sube / se envía).

## Si algo falla con la GPU
- Ver qué detecta Chrome: `npx remotion gpu`.
- Probar otro modo: `$env:REMOTION_GL="vulkan"` (o `"angle-egl"`, o `"swangle"` = sin GPU) y relanzar.
- Escenas 3D (`@remotion/three`): en Windows funcionan con `angle`; en el contenedor necesitan `swangle`.

## Trabajar con Claude en el PC
Esta conversación corre en la nube y no puede usar un Windows directamente. Para que Claude renderice en tu PC,
abre una sesión de **Claude Code** en esta carpeta (app de escritorio o `claude` en PowerShell): leerá `CLAUDE.md`
y hará todo el flujo (guion → voz → capa → render) usando tu GPU. Las ideas y los guiones se siguen compartiendo por git.
