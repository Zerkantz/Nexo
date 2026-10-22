# NEXO

Juego de estrategia e infiltración para **móvil + smartwatch**. Ver [docs/NEXO_Contexto_IA.md](docs/NEXO_Contexto_IA.md) (fuente única de verdad).

```
backend/   Node + Express + Socket.io (Integrante 3)
mobile/    Expo + expo-router (Integrante 1)
wear/      Wear OS, Kotlin + Compose (Integrante 2)
docs/      Documento de contexto
```

## App móvil

```bash
cd mobile
npm install
cp .env.example .env   # poner la URL https del backend
npx expo start         # escanear el QR con Expo Go
```

- `/game/demo` abre el tablero con datos falsos (no necesita backend).
- `npm run typecheck` revisa los tipos.
