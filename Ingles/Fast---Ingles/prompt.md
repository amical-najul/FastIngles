
# Historial de Prompts y Especificaciones - Fast-Ingles

Este archivo contiene el registro histórico de los prompts completos necesarios para replicar cada versión de la aplicación.

## Version 0.0.1

**Objetivo General:**
Crear una aplicación web progresiva (PWA) para aprender inglés llamada "Fast-Ingles" (Método J.L.), basada en la técnica de memorización de Ramón Campayo. La app debe enseñar 50 verbos por día durante un programa de 7 días, enfocándose en la inmersión auditiva y la asociación inverosímil (mnemotecnia).

**Arquitectura Técnica:**
- **Frontend:** React 18 (Vite), Tailwind CSS, TypeScript.
- **Backend:** Node.js con Express.
- **Base de Datos:** PostgreSQL (Cloud SQL).
- **IA:** Google Gemini API (para generación de contenido y TTS).
- **Despliegue:** Google Cloud Run.

**Especificaciones Funcionales:**

1.  **Estructura del Curso:**
    - 7 Días temáticos (Ej: Auxiliares, Movimiento, Comunicación, Mentales, Cotidianos, Sentimientos, Phrasal Verbs).
    - Cada día contiene 50 verbos.
    - El contenido debe generarse dinámicamente usando IA la primera vez, y luego guardarse en la base de datos para futuros accesos (caché global).

2.  **Generación de Contenido (Backend):**
    - Crear un endpoint `/api/lesson/:dayId` que verifique si la lección existe en PostgreSQL.
    - Si existe: Devuelve el JSON almacenado.
    - Si NO existe: Llama a Gemini Flash 2.5 para generar 50 verbos.
    - Formato de generación estricto (pipe delimited): `Palabra|Pronunciación|Traducción|Frase1|Frase2|Frase3|Frase4|Frase5|Mnemotecnia`.
    - La mnemotecnia debe ser una frase en español, creativa y absurda para anclar la palabra.
    - Guardar el resultado en la BD con restricción `UNIQUE` por día para evitar duplicados.

3.  **Reproductor de Lecciones (Player):**
    - **Secuencia de Audio:** Para cada verbo, reproducir en orden: Palabra (EN) -> Traducción (ES) -> 5 Frases de ejemplo (EN) -> Mnemotecnia (ES).
    - **TTS de Alta Calidad:** Usar un Proxy en el servidor que llame a Gemini TTS. El frontend debe recibir audio RAW PCM, convertirlo a WAV y reproducirlo.
    - **Smart Buffering:** Mientras se reproduce el audio actual, descargar silenciosamente el siguiente para evitar pausas ("gaps") por latencia de red.
    - **Visualización:** Al terminar el audio, mostrar una cuenta regresiva de 20 segundos.
        - Pantalla oscura con el texto de la mnemotecnia.
        - Botón para PAUSAR/REANUDAR el temporizador.
        - Botón para SALTAR la espera.
    - Al finalizar la lista, mostrar pantalla de "Misión Cumplida" con opciones: Volver al Dashboard o Repasar Sección.
    - Guardar el progreso (índice del verbo) automáticamente. Si el usuario sale y vuelve, retomar donde quedó.

4.  **Sistema de Usuarios (Auth):**
    - Pantalla de Login/Registro moderna.
    - Campo de contraseña con botón (icono de ojo) para mostrar/ocultar texto.
    - Guardar usuarios en tabla `users` (email, hash password, nombre).
    - Proteger acceso al Dashboard.

5.  **Dashboard y Progreso:**
    - Encabezado con Logo (burbuja de chat con símbolo de traducción), nombre del usuario y botón de cerrar sesión.
    - Grid con los 7 días.
    - Sección de "Progreso": Gráfico circular SVG mostrando el % total completado y desglose visual por día.
    - Footer discreto mostrando la versión de la app (v0.0.1).

6.  **Estilo Visual:**
    - Tema oscuro ("Slate 900").
    - Tipografía limpia (Sans-serif).
    - Diseño "Mobile-First".

7.  **Instrucciones de Base de Datos:**
    - Tablas: `users`, `lessons` (con campo JSONB para contenido), `progress` (mapeo usuario-día-índice).
    - El servidor debe intentar crear las tablas al iniciar si no existen (`initDB`).

## Version 0.0.2

**Mejoras y Correcciones:**

1.  **Solución a Superposición de Audio (Sequence ID):**
    - Se implementó un sistema de "Identificador de Secuencia" (`sequenceIdRef`) en el componente `Player`.
    - Al pulsar "Siguiente" o "Anterior", el ID de secuencia se incrementa.
    - El bucle de reproducción (`playSequence`) y cualquier promesa de audio pendiente verifican este ID antes de continuar.
    - Si el ID ha cambiado, la ejecución antigua se detiene inmediatamente.
    - Se añadió una función `stopAllAudio` que fuerza la pausa del elemento HTML Audio y cancela `speechSynthesis`.

2.  **Interfaz Gráfica del Reproductor:**
    - Se aumentó el tamaño de los botones de navegación ("Anterior" y "Siguiente") a `w-16 h-16` (64px) con iconos más grandes para mejorar la usabilidad táctil.

3.  **Seguridad (Parche previo):**
    - Eliminación de la puerta trasera de autenticación local cuando el servidor rechaza credenciales explícitamente.

## Version 0.0.3

**Cambio de Estrategia: Client-Side SPA & Micro-Learning**

Debido a la complejidad y fricción de desplegar una arquitectura Full-Stack con Base de Datos en entornos de prueba rápida y Cloud Run sin configuración previa, se ha migrado a una arquitectura **100% Client-Side** (Frontend Puro) para el MVP.

**Arquitectura Técnica Refinada:**
- **Frontend Only:** La aplicación corre enteramente en el navegador.
- **Persistencia:** Uso de `LocalStorage` simulando una base de datos para usuarios y progreso.
- **IA:** Llamadas directas a Google Gemini API desde el cliente (usando SDK web).
- **Limpieza:** Eliminación de dependencias de servidor (`express`, `pg`) y `importmap` conflictivos para asegurar despliegue inmediato.

**Nuevas Funcionalidades Pedagógicas:**
1.  **Estructura de 13 Niveles (650 Verbos):**
    - Organización en 5 Fases: Base, Interacción, Pasado/Mente, Perfeccionamiento, Maestría.
    - Se incrementó el alcance de 350 a 650 verbos.
    - Descripciones específicas por nivel para guiar el Prompt de la IA (ej. forzar 3 columnas para verbos irregulares).

2.  **Sistema de Micro-Learning (Rondas):**
    - División de los 50 verbos del día en **5 Rondas** de 10 verbos.
    - Al finalizar una ronda (ej. verbo #10, #20...), el flujo se detiene para evitar fatiga cognitiva.

3.  **Quiz Interactivo:**
    - Al terminar una ronda, se presenta automáticamente un **Quiz Rápido**.
    - 3 preguntas de selección múltiple generadas aleatoriamente sobre los 10 verbos recién estudiados.
    - Feedback inmediato visual (Correcto/Incorrecto) y animaciones.

4.  **Mejoras de Usabilidad (Player):**
    - **Botón Replay:** Durante la fase de visualización (pantalla oscura), el botón principal cambia su función para permitir reiniciar el audio del verbo actual si no se entendió, en lugar de solo esperar.
    - **Reanudación Inteligente:** El botón de Play/Pausa ahora reanuda la frase exacta donde se quedó, en lugar de reiniciar todo el verbo.

## Version 0.0.4

**Personalización y Configuración Avanzada**

Se ha introducido un panel completo de "Configuración" (`SettingsScreen`) para dar control total al usuario sobre su experiencia de aprendizaje y el aspecto de la aplicación.

**Nuevas Funcionalidades:**
1.  **Gestión de Perfil:**
    - Posibilidad de editar nombre, correo electrónico y contraseña.
    - Subida de foto de perfil (simulación con almacenamiento en base64 local).
2.  **Temas Visuales (Theming):**
    - Soporte para 4 temas de color globales que transforman el ambiente de la app:
        - **Slate (Default):** Oscuro y profesional.
        - **Ocean:** Tonos cian profundos.
        - **Forest:** Tonos esmeralda relajantes.
        - **Sunset:** Tonos rojizos cálidos.
3.  **Configuración de Estudio:**
    - **Temporizador Ajustable:** El usuario puede definir cuánto dura la etapa de visualización mnemotécnica (Slider de 3s a 90s, default 20s).
    - **Zona de Peligro:** Botón para resetear todos los datos locales (caché de lecciones y progreso) para reiniciar el curso.
4.  **Configuración de Audio (TTS):**
    - Selector de voces del sistema: Lista todas las voces en inglés disponibles en el navegador (`speechSynthesis.getVoices()`) y permite al usuario elegir su favorita.

## Version 0.0.5

**Modo Práctica y Optimización de Audio**

Se añade un nuevo modo de estudio libre y se optimiza la arquitectura de audio para depender menos de la API y más de las capacidades nativas del dispositivo, mejorando la velocidad y reduciendo latencia.

**Nuevas Funcionalidades:**
1.  **Modo Práctica ("Practice Mode"):**
    - Nueva pantalla accesible desde el Dashboard.
    - Permite crear sesiones de repaso personalizadas utilizando únicamente los verbos que ya han sido generados/desbloqueados en los niveles normales.
    - **Buscador:** Filtrado en tiempo real por palabra en inglés o español.
    - **Selección Flexible:** Posibilidad de seleccionar niveles enteros o verbos individuales específicos.
    - **Juego Rápido:** Botones para iniciar una práctica inmediata con "10 al azar" o "20 al azar".
2.  **Optimización TTS (Browser-First):**
    - La aplicación ahora utiliza explícitamente `window.speechSynthesis` (Voces nativas del navegador) como motor principal de audio en lugar de llamar a la API de Gemini para cada frase.
    - Esto permite funcionamiento offline (si las voces están descargadas en el OS) y elimina tiempos de carga.
    - Implementación de un "Watchdog" para detectar si el audio del navegador se cuelga y forzar el avance a la siguiente frase.
3.  **Refinamiento de UI:**
    - Dashboard Header rediseñado: Ahora incluye botones de acceso rápido (Progreso, Práctica, Salir) y muestra el avatar del usuario.
    - El `Player` ahora soporta modos de lección "no guardables" (dayId=0) para el modo práctica.

## Version 0.0.6

**Ajustes de Estudio, Pronunciación y Seguridad**

Se han implementado controles más finos sobre el comportamiento del reproductor, mejoras en la pronunciación de las ayudas mnemotécnicas y seguridad en la gestión de datos.

**Nuevas Funcionalidades:**
1.  **Control de Velocidad de Voz:**
    - Slider en Configuración > Voz para ajustar la velocidad del TTS entre 0.75x y 1.5x.
2.  **Repetición de Verbos:**
    - Slider en Configuración > Estudio para repetir el verbo en inglés de 1 a 5 veces al inicio de la secuencia de audio.
3.  **Lógica de Quiz Optimizada:**
    - Los exámenes ahora ocurren en hitos estratégicos: Verbos 15, 30 y 50.
    - **Activación automática:** Al finalizar el audio del verbo clave (15, 30, 50), el Quiz inicia inmediatamente sin esperar interacción del usuario.
4.  **UX Zona de Peligro:**
    - Implementación de doble confirmación en el botón "Resetear Datos Locales" (Primer clic alerta, segundo clic confirma).
    - Acción de **Logout** forzoso tras el borrado para reiniciar la sesión limpia.
5.  **Mejora en Pronunciación (Mnemotecnias):**
    - Implementación de un filtro de texto para el TTS en las asociaciones inverosímiles.
    - Convierte textos como `(Slii-p)` a `(sliip)` para que el motor de voz lea la palabra fluida en español en lugar de deletrearla.

## Version 0.0.7

**Panel de Administración Avanzado y Expansión C2**

Se ha profesionalizado el panel de administración y expandido el currículo para cubrir el nivel de maestría C2 real.

**Nuevas Funcionalidades:**
1.  **Gestión Integral de Usuarios (CRUD):**
    - Implementación de un sistema completo para Crear, Leer, Actualizar y Eliminar usuarios desde el panel de administrador.
    - **Modal Interactivo:** Formularios de creación y edición en ventanas modales para mejorar la UX sin salir del contexto.
    - **Control de Roles y Estado:** Capacidad para promover usuarios a administradores y activar/desactivar cuentas (Soft Ban).
    - **Gestión de Contraseñas:** Posibilidad de resetear o establecer contraseñas directamente.

2.  **Dashboard de Estadísticas (Analytics):**
    - Nueva vista "Estadísticas" en el Admin Panel.
    - **KPIs en tiempo real:** Tarjetas visuales mostrando Usuarios Totales, Usuarios Activos, Administradores y Volumen de Contenido Generado.
    - **Métricas de Sistema:** Visualización del peso de la base de datos local (localStorage usage) y estado de conexión con APIs.
    - **Gráficos de Distribución:** Barras visuales para entender la proporción de usuarios activos vs inactivos.

3.  **Expansión Curricular C2 (Maestría):**
    - Se ha ampliado la estructura de **Sustantivos** y **Adjetivos** a 12 Niveles (antes 10).
    - **Nuevos Niveles de Adjetivos:** Nivel 11 (Literario/Descriptivo avanzado) y Nivel 12 (Filosófico/Lógico).
    - **Nuevos Niveles de Sustantivos:** Nivel 11 (Sociedad Global) y Nivel 12 (Condición Humana/Metafísica).
    - Esta expansión asegura una cobertura léxica profunda necesaria para la competencia nativa culta.

4.  **Refactorización de Servicios:**
    - `authService`: Métodos administrativos (`adminCreateUser`, `adminUpdateUser`, `adminDeleteUser`) añadidos para manipular el "mock DB" directamente.
    - `storageService`: Nuevos métodos para agregar métricas globales de todas las lecciones cacheadas.

## Version 0.0.8

**Infraestructura Robusta y Diagnóstico de Sistema**

Se ha fortalecido la infraestructura del backend migrando a almacenamiento de objetos externo y añadiendo capacidades de autodiagnóstico para pruebas End-to-End.

**Mejoras Críticas de Infraestructura:**
1.  **MinIO Externo (VPS):**
    - Migración del almacenamiento local de docker a una instancia MinIO externa (`files.n8nprueba.shop`).
    - Configuración segura de credenciales mediante variables de entorno en backend (`.env` y `docker-compose.yml`), corrigiendo problemas de propagación de secretos en Docker (`AccessDenied`).

2.  **Motor de Audio Híbrido (gTTS + MinIO):**
    - **Backend:** Implementación de `gTTS` (Google Text-to-Speech) como generador primario de audio MP3 en tareas en segundo plano (`BackgroundTasks`).
    - **Almacenamiento:** Los audios generados se suben automáticamente al bucket `fastingles` con nomenclatura hash SHA256 para evitar duplicidad.
    - **Frontend:** Reproducción directa desde URLs de MinIO con fallback automático a `window.speechSynthesis` (Browser TTS) si el archivo remoto no está disponible o falla.

**Nuevas Funcionalidades:**
3.  **Módulo de Diagnóstico ("System Check"):**
    - Nueva sección administrativa `AdminSystemCheck` para validar la integridad del sistema sin afectar datos de producción.
    - **Flujo de Prueba de 3 Pasos:**
        1.  **Simulación AI:** Genera 5 palabras de prueba contra la API de Gemini.
        2.  **Prueba de Escritura:** Intenta guardar en base de datos (ID reservado `9999`) y subir audios a MinIO, confirmando permisos de escritura.
        3.  **Verificación de Lectura:** Recupera los datos y URLs firmadas para testear la conectividad de descarga y reproducción de audio.

4.  **Estabilidad del Backend:**
    - Corrección de errores de importación (`logging`, `typing`) en routers críticos.
    - Aseguramiento de tipos en la gestión de tareas asíncronas de generación de contenido.

## Version 0.0.9

**Sincronización de Usuarios Firebase-Supabase y Resiliencia**

Se ha resuelto un problema crítico de inconsistencia de datos donde los usuarios autenticados exitosamente en Firebase no lograban sincronizarse con la base de datos relacional (Supabase), bloqueando el acceso a la aplicación.

**Mejoras Críticas:**
1.  **Sincronización Resiliente (Retry Logic):**
    - Implementación de un mecanismo de reintento con *exponential backoff* en el cliente (`AuthContext.tsx`).
    - El sistema ahora realiza hasta 3 intentos de sincronización progresivos (esperas de 1s, 2s, 4s) antes de fallar, mitigando errores transitorios de red o latencia en la propagación de claims del token.
    - Esta lógica se aplica tanto al inicio de sesión automático (`onAuthStateChanged`) como al flujo explícito de Google Sign-In.

2.  **JIT Provisioning Reforzado (Backend):**
    - Instrumentación completa con logs detallados en el endpoint de sincronización (`/api/auth/me`) para trazabilidad del proceso "Just-In-Time Provisioning".
    - Mejor diferenciación y manejo de errores entre fallos de validación de token y excepciones de base de datos.

3.  **UX en Fallos de Conexión:**
    - Rediseño de la pantalla de "Error de Sincronización".
    - Eliminación del "callejón sin salida"; ahora se ofrecen acciones claras de recuperación:
        - **Reintentar:** Para fallos de conectividad momentáneos.
        - **Cerrar Sesión:** Permite al usuario limpiar un estado local corrupto y volver a autenticarse limpiamente.
