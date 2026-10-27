# Verificación local — 22 de octubre de 2026

## Compilación

Proyecto compilado con Gradle 8.10.2, Android Gradle Plugin 8.8.0, Kotlin 2.1.20 y Android SDK 35. `assembleDebug`, `testDebugUnitTest` y `lintDebug` terminan correctamente. El informe Lint no contiene errores; mantiene avisos de dependencias y configuración de compatibilidad.

## Pruebas unitarias

5 pruebas, 0 fallos, 0 errores:

- Se conservan los costes y restricciones que envía el servidor.
- La respuesta contiene input y challengeId, sin declarar éxito desde el reloj.
- Se interpreta una secuencia de cerrojo dual.
- Se rechazan índices de nodos fuera del rango válido.
- Se admite nearTarget nulo.

## Prueba funcional en emulador

APK instalado y ejecutado en Wear_OS_Rectangular_API_34 (402 × 476). Se abrió la demostración y se enviaron respuestas en SEQUENCE, GLYPHS, WAVES, FAST_SEQUENCE y CORE_OVERLOAD. En los cinco casos apareció el mensaje de respuesta de prueba enviada. También se comprobó la pantalla MISIÓN COMPLETA. No se registraron excepciones AndroidRuntime.

La primera captura con aceleración gráfica resultó negra. Se reinició el emulador con renderizado por software y se revisaron visualmente la vinculación, el Deck con los arcos y el minijuego de secuencia. Los cuatro nodos son visibles y están separados; los controles adicionales se alcanzan desplazando la pantalla. Se conservaron capturas de estas pantallas.

## Pendiente de integración y hardware

- Backend real: no se proporcionó dirección HTTPS. Los endpoints y eventos están implementados, pero no se ha probado su integración con el servidor del equipo.
- Confirmar las propuestas de params/input, el primer session:state al reloj y los campos opcionales del radar en INTEGRATION.md.
- Reloj físico: no había ninguno conectado; faltan vibraciones, conexión Wi-Fi, consumo y prueba de cuatro dispositivos.
- Pantalla redonda: el entorno disponible solo tenía emulador rectangular. La interfaz usa componentes Wear y márgenes, pero aún requiere comprobación en dispositivo redondo.

El modo demostración no valida aciertos ni entrega recompensas reales. Los tiempos, costes, alerta, victorias, derrotas y desbloqueos reales corresponden siempre al backend.
