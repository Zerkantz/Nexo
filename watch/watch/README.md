# NEXO · Hacker Deck para Wear OS

Aplicación del integrante 2. Kotlin, Compose for Wear OS, Retrofit/OkHttp, Socket.io y DataStore. Textos de juego en español. Requiere Wear OS con API 30 o posterior e Internet propio.

## Abrir y ejecutar

1. Abrir esta carpeta en Android Studio y sincronizar Gradle (JDK 17 o superior).
2. Seleccionar un emulador Wear OS o un reloj físico conectado por depuración inalámbrica.
3. Ejecutar `app`. Para generar el APK: `gradlew.bat assembleDebug`.
4. En el reloj, escribir el origen HTTPS real del servidor, sin `/api`, y pulsar **Generar código**. Escribir el código en el móvil. Se consulta su estado cada 2 segundos hasta vincular o caducar.
5. Iniciar una misión desde el móvil. El reloj recibe su estado, muestra habilidades y responde a los desafíos.

El APK de desarrollo se genera en `app/build/outputs/apk/debug/app-debug.apk`. No contiene contraseñas ni secretos del servidor. `local.properties` es local y no debe subirse al repositorio.

## Demostración

**Probar demostración** funciona sin backend: Deck, cinco minijuegos, controles cooperativos y resultados. Las respuestas de prueba no otorgan recompensas ni se presentan como validadas por un servidor. Se pueden recorrer los controles desplazando la pantalla. No iniciar una demostración durante una misión real; la demostración desconecta el socket. Salir de la demostración vuelve a vinculación.

## Implementado

- Vinculación con caducidad y token persistente en DataStore; copias de seguridad desactivadas.
- Socket autenticado con `auth.token`, reconexión y reingreso a la sesión conocida.
- Espera con recursos; Deck con dos arcos, habilidades y restricciones del servidor.
- SEQUENCE, FAST_SEQUENCE, GLYPHS, WAVES, CORE_OVERLOAD.
- Vibración SUCCESS, FAIL, ALERT_UP y PING.
- Pings, transferencia y desafíos de cerrojo dual; la ventana de 5 segundos se valida en backend.
- Resultado y habilidad desbloqueada; pantalla encendida durante la misión.
- Interfaz desplazable con componentes Wear para relojes redondos y cuadrados.

## Integración pendiente de confirmar

Leer `docs/INTEGRATION.md` antes de conectar. El documento original no define los parámetros de tres minijuegos, el descubrimiento de una sesión nueva ni los datos del radar. Las propuestas están aisladas y señaladas; no son cambios ya acordados. Tampoco se proporcionó una URL del backend.

## Validación

`gradlew.bat testDebugUnitTest lintDebug assembleDebug`

Prueba manual necesaria: vincular dos cuentas, iniciar misión desde móvil, desconectar/reconectar Wi-Fi, abrir cada minijuego, revisar batería/alerta y vibraciones, finalizar misión y reiniciar app. Repetir en emulador redondo, cuadrado y reloj físico. Las pruebas locales no sustituyen la prueba con el backend del integrante 3.

Referencias: [Compose for Wear OS](https://developer.android.com/training/wearables/compose), [cliente Java Socket.io](https://socketio.github.io/socket.io-client-java/installation.html).
