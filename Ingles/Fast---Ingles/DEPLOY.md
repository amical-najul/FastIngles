# Guía de Despliegue en Google Cloud (Cloud Run + Cloud SQL)

Esta guía contiene los comandos exactos configurados con tus datos reales para subir "Fast-Ingles" a producción.

## Requisitos Previos
1.  Tener instalada la **Google Cloud CLI** (`gcloud`).
2.  Estar logueado: `gcloud auth login`.

## Paso 1: Configurar Variables Locales (Opcional)
Si quieres probar en tu PC conectándote a la nube (solo desarrollo), crea un `.env`:
```env
API_KEY=TU_CLAVE_GEMINI_AI
DATABASE_URL=postgres://postgres:[PASSWORD]@[IP]:5432/fast_ingles
```
*(Nota: Para conectar localmente a la IP pública 34.134.240.133 necesitas autorizar tu IP de casa en la consola de Cloud SQL > Conexiones > Redes).*

## Paso 2: Construir y Subir Contenedor
Este paso empaqueta tu código y lo sube a Google Container Registry.

```bash
gcloud builds submit --tag gcr.io/gen-lang-client-0887248091/fast-ingles
```
*(Asegúrate de que el ID del proyecto `gen-lang-client-0887248091` sea el correcto, si es diferente, cámbialo aquí).*

## Paso 3: Desplegar en Cloud Run (Comando Final)
Este comando conecta tu aplicación con la base de datos `fast-ingles-db` usando el socket seguro de Google.

**Copia y pega este bloque completo en tu terminal:**

```bash
gcloud run deploy fast-ingles-app \
  --image gcr.io/gen-lang-client-0887248091/fast-ingles \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances gen-lang-client-0887248091:us-central1:fast-ingles-db \
  --set-env-vars API_KEY=TU_CLAVE_GEMINI_AQUI \
  --set-env-vars DATABASE_URL="postgres://postgres:Colombia1@_@/fast_ingles?host=/cloudsql/gen-lang-client-0887248091:us-central1:fast-ingles-db"
```

### IMPORTANTE:
1.  Reemplaza `TU_CLAVE_GEMINI_AQUI` con tu API Key real de Google AI Studio.
2.  Si la consola te pregunta si quieres crear el servicio, di **Y** (Yes).

## Paso 4: Verificación
Una vez termine el comando, te dará una URL (ej: `https://fast-ingles-app-xyz.a.run.app`).
1.  Abre esa URL.
2.  Intenta registrarte.
3.  Si todo sale bien, la aplicación habrá creado las tablas automáticamente y tu usuario quedará guardado.
