# Contrato del reloj

Se mantienen los nombres de endpoints, eventos y envoltorios de la sección 12 de IdeaNexo.md. Esta tabla documenta propuestas donde el documento no fija el contenido; deben confirmarse con el integrante 3 antes de dar la integración por terminada.

## REST y conexión

- `POST /api/pairing/code`: `{code,pairingToken,expiresAt}`; fecha ISO-8601 UTC.
- `GET /api/pairing/status/{pairingToken}`: PENDING o LINKED con `watchToken` y `player`.
- `GET /api/me`: recursos desde `player` o directamente en la raíz.
- Socket.io usa origen HTTPS, conexión autenticada con `{token}` y reconexión automática.
- Servidor autoriza el rol watch y la pertenencia a la sesión en cada intención.

## Descubrimiento de misión (falta en el documento original)

La app necesita recibir `session:state` por la sala `player:{playerId}` cuando el móvil inicia una partida y también al conectar un reloj con partida activa. Con ese `sessionId` envía `session:join`; al reconectar repite el join de la sesión persistida. Esto usa eventos existentes, pero requiere que el backend envíe ese primer estado a la sala del jugador. No hay un endpoint inventado para buscar sesiones. Enviar `watch:context` después de `session:state` y tras cada join, con los datos autoritativos del jugador correspondiente.

## Desafíos

Comunes: `{challengeId,minigame,params,expiresAt}`. Respuesta: `watch:hack_result {challengeId,input}`. No se envía `success`. Cada desafío admite un envío por ejecución; el servidor debe deduplicar por challengeId y validar jugador, expiración y consumo.

| Minijuego | params | input | Estado |
|---|---|---|---|
| SEQUENCE / FAST_SEQUENCE | `{sequence:[2,0,3,1],showMs:600}` | `[2,0,3,1]` | params del documento; formato de input propuesto |
| GLYPHS | `{symbols:6,initial:[0,1,2],target:[2,4,1]}` | `{positions:[2,4,1]}` | Propuesta |
| WAVES | `{periodMs:2400,phase:1.5}` | `{elapsedMs:1200}` | Propuesta; fase en radianes, tiempo desde primera presentación |
| CORE_OVERLOAD | `{durationMs:3000,targetStart:0.65,targetEnd:0.8}` | `{heldMs:2100}` | Propuesta; marcas como fracciones 0–1 |

En WAVES las ondas en el centro son sin(t) y sin(-t+phase), con t=2π·elapsedMs/periodMs. El servidor define la tolerancia y valida. El tiempo declarado por el cliente no es prueba antifraude; el backend debe verificar el plazo real y cualquier protección adicional que el equipo acuerde.

`coop:dual_hack_start` acepta los campos originales. Si params contiene sequence, se presenta SEQUENCE; otros minijuegos requieren minigame explícito. Se responde con watch:hack_result; el servidor coordina los dos resultados y su margen de 5 segundos.

Un desafío vencido se cierra localmente sin inventar un resultado de derrota; el servidor debe vencerlo por su propio reloj. Un envío interrumpido no se reenvía automáticamente, para no duplicar acciones. El servidor puede reenviar un desafío no respondido al reconectar.

## Habilidades y feedback

`watch:context` gobierna batería, alerta, objetivo y coste/disponibilidad. Se recomienda incluir HACK en skills (si se omite, se muestra el botón junto al objetivo y el servidor valida el coste). nearTarget admite identificador de texto o `{id}`.

Feedback de la sección 12: `{type,data}`. Para PING se propone `data.type` con DANGER/WAIT/GO/HELP. SUCCESS/FAIL cierran el minijuego actual. Emitir ALERT_UP una vez al cruzar el umbral de sospecha.

## Radar

El documento incluye una brújula y pulsos según distancia pero no define su mensaje ni campos. La intención RADAR se envía como watch:skill. Como propuesta opcional, watch:context acepta `radar:{bearingDegrees:45,distance:3}` o null al desactivarse. La brújula indica rumbo relativo al norte del mapa, 0 arriba, 90 derecha; no utiliza magnetómetro físico. Los pulsos se aceleran al disminuir la distancia y se detienen cuando la pantalla deja de estar activa. El servidor calcula ambos valores. Esta extensión debe confirmarse antes de usarla en producción; la demo permite verla sin backend.

## Fin de partida

`game:ended {result,rewards,unlockedSkill?}` con rewards individuales `{credits,energy,intel}`. En co-op el backend debe enviar a cada jugador sus recompensas. Tras finalizar se borran la sesión persistida y el desafío.
