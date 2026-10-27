package com.nexo.watch

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.nexo.watch.data.*
import com.nexo.watch.haptics.WatchHaptics
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import org.json.JSONObject
import retrofit2.HttpException
import java.net.URI
import java.time.Instant

data class WatchState(
    val loading: Boolean = true, val demo: Boolean = false, val url: String = "http://10.0.2.2:3000", val paired: Boolean = false,
    val connected: Boolean = false, val code: String? = null, val codeExpiry: Long = 0,
    val message: String? = null, val resources: Resources = Resources(), val sessionId: String? = null,
    val active: Boolean = false, val coop: Boolean = false, val deck: Deck? = null,
    val challenge: Challenge? = null, val submitted: Boolean = false, val outcome: Outcome? = null
)

class WatchViewModel(application: Application) : AndroidViewModel(application) {
    private val mutable = MutableStateFlow(WatchState())
    val state = mutable.asStateFlow()
    private val store = WatchStore(application)
    private val haptics = WatchHaptics(application)
    private var socket: Socket? = null
    private var pairingJob: Job? = null
    private var token = ""
    private var generation = 0
    private val sentChallenges = mutableSetOf<String>()

    init { viewModelScope.launch {
        val saved = store.load()
        token = saved.token
        val initialUrl = saved.url.ifBlank { "http://10.0.2.2:3000" }
        mutable.update { it.copy(loading = false, url = initialUrl, paired = token.isNotBlank(), sessionId = saved.sessionId.ifBlank { null }) }
        if (token.isNotBlank() && initialUrl.isNotBlank()) connect(initialUrl)
    } }

    fun pair(rawUrl: String) {
        val origin = runCatching {
            val trimmed = rawUrl.trim().trimEnd('/')
            val withScheme = if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) trimmed else "http://$trimmed"
            val uri = URI(withScheme)
            require((uri.scheme == "https" || uri.scheme == "http") && !uri.host.isNullOrBlank() && uri.userInfo == null && uri.query == null && uri.fragment == null && uri.path.isNullOrEmpty())
            uri.toString()
        }.getOrElse { message("Escribe la dirección del servidor (ej. http://192.168.33.4:3000), sin /api."); return }
        disconnect()
        val current = ++generation
        pairingJob?.cancel()
        pairingJob = viewModelScope.launch {
            mutable.value = WatchState(loading = true, url = origin)
            try {
                store.clearToken()
                store.save(origin, "")
                val api = NexoApi.create(origin)
                val code = JSONObject(api.code().toString())
                val expires = Instant.parse(code.getString("expiresAt")).toEpochMilli()
                mutable.update { it.copy(loading = false, code = code.getString("code"), codeExpiry = expires) }
                while (isActive && System.currentTimeMillis() < expires) {
                    delay(2000)
                    val response = JSONObject(api.status(code.getString("pairingToken")).toString())
                    if (response.getString("status") == "LINKED") {
                        token = response.getString("watchToken")
                        store.save(origin, token)
                        if (current != generation) return@launch
                        mutable.update { it.copy(paired = true, code = null, resources = Protocol.resources(response.getJSONObject("player"))) }
                        connect(origin)
                        return@launch
                    }
                }
                mutable.update { it.copy(code = null, message = "El código caducó. Genera uno nuevo.") }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (current == generation) mutable.update { it.copy(loading = false, code = null, message = "No se pudo vincular. Revisa Internet y la dirección del servidor.") } }
        }
    }

    private fun connect(origin: String) {
        disconnect()
        val current = generation
        val options = IO.Options.builder().setAuth(mapOf("token" to token)).setReconnection(true).build()
        val client = IO.socket(origin, options)
        socket = client
        fun listen(event: String, handler: (JSONObject) -> Unit) {
            client.on(event) { args -> viewModelScope.launch {
                if (socket !== client || current != generation) return@launch
                try { handler(args.firstOrNull() as? JSONObject ?: JSONObject(args.firstOrNull()?.toString() ?: "{}")) }
                catch (_: Exception) { message("El servidor envió datos incompletos para $event.") }
            } }
        }
        client.on(Socket.EVENT_CONNECT) { viewModelScope.launch {
            if (socket !== client) return@launch
            mutable.update { it.copy(connected = true, message = null) }
            state.value.sessionId?.let { client.emit("session:join", JSONObject().put("sessionId", it)) }
            refreshResources(origin)
        } }
        client.on(Socket.EVENT_DISCONNECT) { viewModelScope.launch {
            if (socket === client) mutable.update { it.copy(connected = false, deck = null, challenge = null, message = "Reconectando…") }
        } }
        client.on(Socket.EVENT_CONNECT_ERROR) { viewModelScope.launch {
            if (socket === client) { mutable.update { it.copy(connected = false) }; message("Sin conexión. Comprueba el servidor o vuelve a vincular.") }
        } }
        listen("session:state") { json ->
            val id = json.getString("sessionId")
            val previous = state.value.sessionId
            val active = json.getString("status") == "PLAYING"
            mutable.update { it.copy(sessionId = id, active = active, coop = json.optString("type") == "COOP",
                outcome = if (previous != id) null else it.outcome,
                challenge = if (!active || previous != id) null else it.challenge,
                deck = if (!active || previous != id) null else it.deck) }
            viewModelScope.launch { store.session(if (active) id else "") }
            if (previous != id && active) { sentChallenges.clear(); client.emit("session:join", JSONObject().put("sessionId", id)) }
        }
        listen("watch:context") { json -> mutable.update { it.copy(deck = Protocol.deck(json)) } }
        listen("watch:hack_challenge") { acceptChallenge(it, false) }
        listen("coop:dual_hack_start") { acceptChallenge(it, true) }
        listen("watch:feedback") { json ->
            val type = json.getString("type")
            haptics.play(type)
            val text = when (type) { "SUCCESS" -> "Hackeo correcto"; "FAIL" -> "Hackeo fallido"; "ALERT_UP" -> "Alerta: sospecha"; "PING" -> {
                val ping = json.optJSONObject("data")?.optString("type")
                mapOf("DANGER" to "Peligro", "WAIT" to "Espera", "GO" to "Avanza", "HELP" to "Ayuda")[ping] ?: "Aviso del compañero"
            }; else -> "" }
            mutable.update { it.copy(message = text, challenge = if (type == "SUCCESS" || type == "FAIL") null else it.challenge) }
        }
        listen("game:ended") { json ->
            mutable.update { it.copy(active = false, sessionId = null, challenge = null, deck = null,
                outcome = Outcome(json.getString("result") == "WON", Protocol.resources(json.getJSONObject("rewards")), json.optString("unlockedSkill").ifEmpty { null })) }
            viewModelScope.launch { store.session(""); refreshResources(origin) }
        }
        listen("error") { json -> message(json.optString("message", "La acción no está disponible.")) }
        client.connect()
    }

    private suspend fun refreshResources(origin: String) {
        val current = generation
        try {
            val json = JSONObject(NexoApi.create(origin).me("Bearer $token").toString())
            if (current != generation) return
            mutable.update { it.copy(resources = Protocol.resources(json.optJSONObject("player") ?: json)) }
        } catch (e: HttpException) {
            if (current != generation) return
            if (e.code() == 401) { disconnect(); store.clearToken(); token = ""; mutable.update { it.copy(paired = false, connected = false, active = false, deck = null, message = "La sesión caducó. Vincula de nuevo.") } }
        } catch (e: CancellationException) { throw e }
        catch (_: Exception) { if (current == generation) message("No se pudieron actualizar los recursos.") }
    }

    private fun acceptChallenge(json: JSONObject, dual: Boolean) {
        val challenge = Protocol.challenge(json, dual)
        require(challenge.expiresAt > System.currentTimeMillis())
        mutable.update { it.copy(challenge = challenge, submitted = challenge.id in sentChallenges, message = null) }
    }
    fun skill(skill: Skill) {
        if (!skill.available || skill.cost > (state.value.deck?.battery ?: 0)) return
        if (state.value.demo) {
            if (skill.code == "RADAR") mutable.update { it.copy(deck = it.deck?.copy(radar = Radar(45f, 3))) }
            message("Demostración: ${Protocol.skillNames[skill.code]}"); haptics.play("SUCCESS"); return
        }
        emit("watch:skill", JSONObject().put("skill", skill.code))
    }
    fun hack() {
        if (state.value.demo) { demoChallenge("SEQUENCE"); return }
        state.value.deck?.target?.let { emit("watch:hack_request", JSONObject().put("targetId", it)) }
    }
    fun ping(type: String) {
        if (!state.value.coop) return
        if (state.value.demo) { haptics.play("PING"); message("Demostración: aviso $type"); return }
        emit("coop:ping", JSONObject().put("type", type))
    }
    fun transfer() {
        if (!state.value.coop || (state.value.deck?.battery ?: 0) < 25) return
        if (state.value.demo) { message("Demostración: transferencia de 25 %"); return }
        emit("coop:transfer_battery", JSONObject())
    }
    fun submit(challenge: Challenge, input: Any) {
        if (state.value.challenge?.id != challenge.id || challenge.id in sentChallenges || System.currentTimeMillis() >= challenge.expiresAt) return
        if (state.value.demo) {
            sentChallenges.add(challenge.id)
            mutable.update { it.copy(submitted = true, message = "Respuesta de prueba enviada. El servidor decidirá el resultado.") }
        } else if (emit("watch:hack_result", Protocol.result(challenge.id, input))) {
            sentChallenges.add(challenge.id)
            mutable.update { it.copy(submitted = true, message = "Esperando validación…") }
        }
    }
    private fun emit(event: String, data: JSONObject): Boolean {
        if (!state.value.connected || !state.value.active || socket?.connected() != true) { message("Espera a recuperar la conexión y la misión."); return false }
        socket?.emit(event, data)
        return true
    }
    fun clearChallenge() { mutable.update { it.copy(challenge = null, submitted = false) } }
    fun dismissResult() { mutable.update { it.copy(outcome = null, message = null) } }
    fun clearMessage() { mutable.update { it.copy(message = null) } }
    private fun message(text: String) { mutable.update { it.copy(message = text) } }
    fun unlink() {
        generation++; pairingJob?.cancel(); disconnect(); token = ""
        viewModelScope.launch { store.clearToken(); mutable.value = WatchState(loading = false, url = state.value.url) }
    }
    fun demo() {
        generation++; pairingJob?.cancel(); disconnect()
        mutable.value = WatchState(loading = false, demo = true, paired = true, connected = true, active = true, coop = true,
            resources = Resources(100, 50, 10), deck = Deck(80, 100, 35, "DOOR_1",
                listOf(Skill("SCANNER", 15, true, null), Skill("SABOTAGE", 25, true, null), Skill("CAMOUFLAGE", 35, true, null), Skill("RADAR", 15, true, null), Skill("HACK", 20, true, null))))
    }
    fun demoChallenge(kind: String, dual: Boolean = false) {
        val params = when (kind) {
            "SEQUENCE", "FAST_SEQUENCE" -> JSONObject().put("sequence", Protocol.sequence(if (kind == "SEQUENCE") listOf(2,0,3,1) else listOf(1,3,0,2,1))).put("showMs", if (kind == "SEQUENCE") 600 else 350)
            "GLYPHS" -> JSONObject().put("symbols", 6).put("initial", Protocol.sequence(listOf(0,1,2))).put("target", Protocol.sequence(listOf(2,4,1)))
            "WAVES" -> JSONObject().put("periodMs", 2400).put("phase", 1.5)
            else -> JSONObject().put("durationMs", 3000).put("targetStart", 0.65).put("targetEnd", 0.8)
        }
        mutable.update { it.copy(challenge = Challenge("demo-${System.nanoTime()}", kind, params, System.currentTimeMillis() + 45000, dual), submitted = false, message = null) }
    }
    fun demoResult(won: Boolean) { mutable.update { it.copy(outcome = Outcome(won, Resources(if (won) 150 else 25, 40, 15), if (won) "OVERLOAD" else null), active = false) } }
    private fun disconnect() { socket?.off(); socket?.disconnect(); socket = null }
    override fun onCleared() { disconnect(); super.onCleared() }
}
