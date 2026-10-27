package com.nexo.watch.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.*
import com.nexo.watch.WatchState
import com.nexo.watch.WatchViewModel
import com.nexo.watch.data.*
import kotlinx.coroutines.delay
import com.nexo.watch.haptics.WatchHaptics

val Cyan = Color(0xFF00F0FF)
val Background = Color(0xFF060913)
val Panel = Color(0xFF111827)
val Amber = Color(0xFFFF9900)
val Red = Color(0xFFFF003C)
val Green = Color(0xFF00FF66)
fun alertColor(alert: Int) = when { alert >= 100 -> Red; alert >= 50 -> Amber; else -> Cyan }

@Composable
fun NexoApp(state: WatchState, model: WatchViewModel) {
    MaterialTheme(colors = Colors(primary = Cyan, secondary = Green, background = Background, surface = Panel, onPrimary = Background, onSurface = Color.White)) {
        Box(Modifier.fillMaxSize().background(Background)) {
            if (state.challenge != null) {
                key(state.challenge.id) { ChallengeScreen(state.challenge, state.submitted, state.connected, state.message, model::submit, model::clearChallenge) }
            } else {
                var server by rememberSaveable(state.url) { mutableStateOf(state.url) }
                val listState = rememberScalingLazyListState(initialCenterItemIndex = 0)
                LaunchedEffect(state.paired, state.active, state.outcome != null, state.code != null) { listState.scrollToItem(0) }
                ScalingLazyColumn(
                    state = listState,
                    autoCentering = null,
                    modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally,
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 28.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item { Text("NEXO", color = Cyan, fontSize = 24.sp, fontWeight = FontWeight.Bold) }
                    item { Text(if (state.demo) "DEMO · HACKER DECK" else "HACKER DECK", fontSize = 10.sp, color = Color.LightGray) }
                    if (state.message != null) {
                        item { Text(state.message, fontSize = 12.sp, textAlign = TextAlign.Center, color = Amber) }
                        item { Action("Entendido", action = model::clearMessage) }
                    }
                    when {
                        state.loading -> item { Text("Conectando…") }
                        state.code != null -> {
                            item { Text("Vincula desde tu móvil", fontSize = 12.sp) }
                            item { Text(state.code, fontSize = 38.sp, fontWeight = FontWeight.Bold, color = Cyan) }
                            item { Expiry(state.codeExpiry) }
                            item { Action("Cancelar", action = model::unlink) }
                        }
                        !state.paired -> {
                            item { Text("Conecta tu Hacker Deck", textAlign = TextAlign.Center, fontSize = 13.sp) }
                            item {
                                BasicTextField(server, { server = it }, modifier = Modifier.fillMaxWidth().background(Panel).padding(12.dp),
                                    textStyle = TextStyle(color = Color.White, fontSize = 12.sp), cursorBrush = SolidColor(Cyan), singleLine = true,
                                    decorationBox = { inner -> if (server.isBlank()) Text("http://192.168.33.4:3000", fontSize = 12.sp, color = Color.Gray); inner() })
                            }
                            item { Action("Generar código", action = { model.pair(server) }) }
                            item { Action("Emulador (10.0.2.2)", action = { server = "http://10.0.2.2:3000"; model.pair("http://10.0.2.2:3000") }) }
                            item { Action("Wi-Fi Local (192.168.33.4)", action = { server = "http://192.168.33.4:3000"; model.pair("http://192.168.33.4:3000") }) }
                            item { Action("Probar demostración", action = model::demo) }
                        }
                        state.outcome != null -> {
                            item { Text(if (state.outcome.won) "MISIÓN COMPLETA" else "LOCKDOWN", color = if (state.outcome.won) Green else Red, textAlign = TextAlign.Center) }
                            item { ResourceText(state.outcome.resources) }
                            state.outcome.unlockedSkill?.let { skill -> item { Text("Desbloqueado: ${Protocol.skillNames[skill] ?: skill}", fontSize = 12.sp, textAlign = TextAlign.Center) } }
                            item { Action("Continuar", action = if (state.demo) model::demo else model::dismissResult) }
                        }
                        !state.active -> {
                            item { Text(if (state.connected) "Sin misión activa" else "Conectando al servidor…", textAlign = TextAlign.Center) }
                            item { ResourceText(state.resources) }
                            item { Text("Inicia una misión desde el móvil", fontSize = 12.sp, textAlign = TextAlign.Center, color = Color.LightGray) }
                            item { Action("Volver a vincular", action = model::unlink) }
                        }
                        else -> {
                            if (!state.connected) item { Text("Reconectando…", color = Amber) }
                            val deck = state.deck
                            if (deck == null) item { Text("Sincronizando el Deck…", textAlign = TextAlign.Center) }
                            else {
                                item { Gauges(deck) }
                                deck.radar?.let { radar -> item { RadarDisplay(radar) } }
                                deck.skills.firstOrNull { it.code == "HACK" }?.let { hack ->
                                    if (deck.target != null) item { Action("Hackear · ${hack.cost} %", state.connected && hack.available && deck.battery >= hack.cost, model::hack) }
                                }
                                if (deck.target != null && deck.skills.none { it.code == "HACK" }) item {
                                    Action("Hackear", state.connected, model::hack)
                                }
                                items(deck.skills.filter { it.code != "HACK" }) { skill ->
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Action("${Protocol.skillNames[skill.code] ?: skill.code} · ${skill.cost} %", state.connected && skill.available && deck.battery >= skill.cost) { model.skill(skill) }
                                        if (!skill.available && skill.reason != null) Text(skill.reason, fontSize = 10.sp, color = Color.LightGray, textAlign = TextAlign.Center)
                                    }
                                }
                                if (state.coop) {
                                    item { Text("COOPERATIVO", color = Cyan, fontSize = 12.sp) }
                                    items(listOf("DANGER" to "Peligro", "WAIT" to "Espera", "GO" to "Avanza", "HELP" to "Ayuda")) { (type, label) ->
                                        Action(label, state.connected) { model.ping(type) }
                                    }
                                    item { Action("Transferir 25 %", state.connected && deck.battery >= 25, model::transfer) }
                                }
                            }
                            if (state.demo) {
                                item { Text("MINIJUEGOS DE PRUEBA", fontSize = 11.sp, color = Amber) }
                                items(listOf("SEQUENCE" to "Secuencia", "GLYPHS" to "Glifos", "WAVES" to "Ondas", "FAST_SEQUENCE" to "Secuencia rápida", "CORE_OVERLOAD" to "Núcleo")) { (kind, label) -> Action(label) { model.demoChallenge(kind) } }
                                item { Action("Ver victoria") { model.demoResult(true) } }
                                item { Action("Probar cerrojo dual") { model.demoChallenge("SEQUENCE", dual = true) } }
                                item { Action("Ver derrota") { model.demoResult(false) } }
                                item { Action("Salir de demostración", action = model::unlink) }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RadarDisplay(radar: Radar) {
    val context = LocalContext.current
    val haptics = remember { WatchHaptics(context) }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(radar, lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            while (true) { haptics.play("SUCCESS"); delay((300L + radar.distance * 140L).coerceAtMost(2500L)) }
        }
    }
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Canvas(Modifier.size(56.dp)) {
            drawCircle(Panel, style = Stroke(2.dp.toPx()))
            val angle = Math.toRadians(radar.bearingDegrees.toDouble() - 90)
            val end = Offset(center.x + kotlin.math.cos(angle).toFloat() * size.width * 0.4f, center.y + kotlin.math.sin(angle).toFloat() * size.height * 0.4f)
            drawLine(Cyan, center, end, 3.dp.toPx())
            drawCircle(Cyan, 4.dp.toPx(), end)
        }
        Text("Objetivo: ${radar.distance} casillas", fontSize = 11.sp, color = Cyan)
        Text("Arriba = norte del mapa", fontSize = 9.sp, color = Color.LightGray)
    }
}

@Composable
fun Action(label: String, enabled: Boolean = true, action: () -> Unit) {
    Chip(onClick = action, enabled = enabled, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
        colors = ChipDefaults.chipColors(backgroundColor = Panel, contentColor = Cyan),
        label = { Text(label, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) })
}

@Composable
fun ResourceText(resources: Resources) {
    Text("${resources.credits} créditos\n${resources.energy} energía · ${resources.intel} información", fontSize = 12.sp, textAlign = TextAlign.Center)
}

@Composable
fun Expiry(expiresAt: Long) {
    var remaining by remember(expiresAt) { mutableLongStateOf(0) }
    LaunchedEffect(expiresAt) { while (true) { remaining = ((expiresAt - System.currentTimeMillis()) / 1000).coerceAtLeast(0); delay(250) } }
    Text("Caduca en ${remaining}s", fontSize = 11.sp, color = Color.LightGray)
}

@Composable
fun Gauges(deck: Deck) {
    Box(Modifier.size(126.dp), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize().padding(5.dp)) {
            val stroke = Stroke(5.dp.toPx())
            drawArc(Panel, 135f, 270f, false, style = stroke)
            drawArc(Cyan, 135f, 270f * (deck.battery.toFloat() / deck.maxBattery).coerceIn(0f, 1f), false, style = stroke)
            val inset = 11.dp.toPx()
            val innerSize = Size(size.width - inset * 2, size.height - inset * 2)
            drawArc(Panel, 135f, 270f, false, Offset(inset, inset), innerSize, style = stroke)
            drawArc(alertColor(deck.alert), 135f, 270f * (deck.alert / 100f).coerceIn(0f, 1f), false, Offset(inset, inset), innerSize, style = stroke)
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("${deck.battery}/${deck.maxBattery}", color = Cyan, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text("BATERÍA", color = Color.LightGray, fontSize = 9.sp)
            Text("Alerta ${deck.alert} %", color = alertColor(deck.alert), fontSize = 12.sp)
        }
    }
}
