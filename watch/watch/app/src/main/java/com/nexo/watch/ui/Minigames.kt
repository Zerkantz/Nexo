package com.nexo.watch.ui

import android.os.SystemClock
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Text
import com.nexo.watch.data.Challenge
import com.nexo.watch.data.Protocol
import kotlinx.coroutines.delay
import org.json.JSONObject
import kotlin.math.PI
import kotlin.math.sin

@Composable
fun ChallengeScreen(challenge: Challenge, submitted: Boolean, connected: Boolean, message: String?, submit: (Challenge, Any) -> Unit, close: () -> Unit) {
    var expired by remember { mutableStateOf(false) }
    LaunchedEffect(challenge.expiresAt) {
        delay((challenge.expiresAt - System.currentTimeMillis()).coerceAtLeast(0))
        expired = true
    }
    ScalingLazyColumn(state = rememberScalingLazyListState(initialCenterItemIndex = 0), autoCentering = null, modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 20.dp, vertical = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item { Text(if (challenge.dual) "CERROJO DUAL" else "HACKEO", color = Cyan, fontSize = 14.sp) }
        item { Expiry(challenge.expiresAt) }
        if (challenge.dual) item { Text("Coordina el acierto con tu compañero", fontSize = 11.sp, textAlign = TextAlign.Center) }
        when {
            expired -> item { Text("Tiempo agotado", color = Red) }
            submitted -> item { Text(message ?: "Esperando validación…", color = Amber, textAlign = TextAlign.Center, fontSize = 12.sp) }
            !connected -> item { Text("Se perdió la conexión", color = Amber) }
            else -> item {
                when (challenge.kind) {
                    "SEQUENCE", "FAST_SEQUENCE" -> SequenceGame(challenge) { submit(challenge, Protocol.sequence(it)) }
                    "GLYPHS" -> GlyphGame(challenge) { submit(challenge, JSONObject().put("positions", Protocol.sequence(it))) }
                    "WAVES" -> WaveGame(challenge) { submit(challenge, JSONObject().put("elapsedMs", it)) }
                    "CORE_OVERLOAD" -> CoreGame(challenge) { submit(challenge, JSONObject().put("heldMs", it)) }
                }
            }
        }
        if (expired || submitted) item { Action("Volver al Deck", action = close) }
    }
}

@Composable
fun SequenceGame(challenge: Challenge, submit: (List<Int>) -> Unit) {
    val sequence = remember { challenge.params.getJSONArray("sequence").let { a -> (0 until a.length()).map { a.getInt(it) } } }
    var active by remember { mutableIntStateOf(-1) }
    var ready by remember { mutableStateOf(false) }
    var input by remember { mutableStateOf(emptyList<Int>()) }
    LaunchedEffect(challenge.id) {
        delay(500)
        sequence.forEach { node -> active = node; delay(challenge.params.getLong("showMs")); active = -1; delay(180) }
        ready = true
    }
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(if (ready) "Repite · ${input.size}/${sequence.size}" else "Observa el patrón", fontSize = 12.sp)
        val colors = listOf(Cyan, Green, Amber, Red)
        repeat(2) { row -> Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(2) { col ->
                val index = row * 2 + col
                Button(onClick = {
                    if (input.size < sequence.size) {
                        input = input + index
                        if (input.size == sequence.size) submit(input)
                    }
                }, enabled = ready && input.size < sequence.size, modifier = Modifier.size(48.dp),
                    colors = ButtonDefaults.buttonColors(backgroundColor = colors[index].copy(alpha = if (active == index || ready) 1f else 0.18f),
                        disabledBackgroundColor = colors[index].copy(alpha = if (active == index) 1f else 0.18f))) {
                    Text("${index + 1}", color = if (active == index || ready) Background else Color.White)
                }
            }
        } }
    }
}

@Composable
fun GlyphGame(challenge: Challenge, submit: (List<Int>) -> Unit) {
    val symbols = challenge.params.getInt("symbols")
    val target = remember { challenge.params.getJSONArray("target").let { a -> (0..2).map { a.getInt(it) } } }
    var positions by remember { mutableStateOf(challenge.params.getJSONArray("initial").let { a -> (0..2).map { a.getInt(it) } }) }
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Alinea los tres anillos", fontSize = 12.sp)
        Canvas(Modifier.size(100.dp)) {
            repeat(3) { ring ->
                val radius = size.minDimension * (0.46f - ring * 0.12f)
                drawCircle(Panel, radius, style = Stroke(3.dp.toPx()))
                val angle = positions[ring] * 2 * PI / symbols - PI / 2
                val targetAngle = target[ring] * 2 * PI / symbols - PI / 2
                drawCircle(Green, 3.dp.toPx(), Offset(center.x + kotlin.math.cos(targetAngle).toFloat() * radius, center.y + sin(targetAngle).toFloat() * radius))
                drawCircle(Cyan, 5.dp.toPx(), Offset(center.x + kotlin.math.cos(angle).toFloat() * radius, center.y + sin(angle).toFloat() * radius), style = Stroke(2.dp.toPx()))
            }
        }
        repeat(3) { ring -> Action("Anillo ${ring + 1}: ${positions[ring] + 1} → ${target[ring] + 1}") {
            positions = positions.mapIndexed { i, value -> if (i == ring) (value + 1) % symbols else value }
        } }
        Action("Enviar alineación") { submit(positions) }
    }
}

@Composable
fun WaveGame(challenge: Challenge, submit: (Long) -> Unit) {
    val started = remember { SystemClock.elapsedRealtime() }
    var elapsed by remember { mutableLongStateOf(0) }
    LaunchedEffect(challenge.id) { while (true) { elapsed = SystemClock.elapsedRealtime() - started; delay(16) } }
    val period = challenge.params.getLong("periodMs")
    val phase = challenge.params.getDouble("phase")
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Toca cuando se crucen en el centro", fontSize = 12.sp, textAlign = TextAlign.Center)
        Canvas(Modifier.fillMaxWidth().height(74.dp)) {
            drawLine(Color.Gray, Offset(center.x, 0f), Offset(center.x, size.height))
            repeat(2) { wave ->
                val path = Path()
                for (step in 0..100) {
                    val x = size.width * step / 100
                    val t = elapsed.toDouble() / period * 2 * PI
                    val y = center.y + sin((step - 50) / 100.0 * 2 * PI + (if (wave == 0) t else -t + phase)).toFloat() * size.height * 0.35f
                    if (step == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                drawPath(path, if (wave == 0) Cyan else Amber, style = Stroke(2.dp.toPx()))
            }
        }
        Action("Sincronizar") { submit(SystemClock.elapsedRealtime() - started) }
    }
}

@Composable
fun CoreGame(challenge: Challenge, submit: (Long) -> Unit) {
    var started by remember { mutableLongStateOf(0) }
    var held by remember { mutableLongStateOf(0) }
    var pressing by remember { mutableStateOf(false) }
    var sent by remember { mutableStateOf(false) }
    val duration = challenge.params.getLong("durationMs")
    LaunchedEffect(pressing) { while (pressing) { held = SystemClock.elapsedRealtime() - started; delay(16) } }
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Mantén y suelta en la zona verde", textAlign = TextAlign.Center, fontSize = 12.sp)
        Canvas(Modifier.fillMaxWidth().height(92.dp)
            .semantics { contentDescription = "Mantener pulsado para cargar el núcleo; soltar para enviar" }
            .pointerInput(challenge.id) {
                detectTapGestures(onPress = {
                    if (!sent) {
                        started = SystemClock.elapsedRealtime(); pressing = true
                        val released = tryAwaitRelease()
                        pressing = false
                        if (released) { sent = true; submit(SystemClock.elapsedRealtime() - started) } else held = 0
                    }
                })
            }) {
            val radius = size.minDimension * 0.4f
            drawCircle(Panel, radius, style = Stroke(8.dp.toPx()))
            val start = challenge.params.getDouble("targetStart").toFloat()
            val end = challenge.params.getDouble("targetEnd").toFloat()
            drawArc(Green, -90 + 360 * start, 360 * (end - start), false,
                topLeft = Offset(center.x - radius, center.y - radius), size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2), style = Stroke(8.dp.toPx()))
            val angle = ((held.toFloat() / duration).coerceIn(0f, 1f) * 2 * PI - PI / 2)
            drawLine(Cyan, center, Offset(center.x + kotlin.math.cos(angle).toFloat() * radius, center.y + sin(angle).toFloat() * radius), 3.dp.toPx())
        }
        Text(if (pressing) "Suelta en la marca" else "Pulsa el núcleo", fontSize = 11.sp, color = Cyan)
    }
}
