package com.nexo.watch.data

import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

data class Skill(val code: String, val cost: Int, val available: Boolean, val reason: String?)
data class Radar(val bearingDegrees: Float, val distance: Int)
data class Deck(val battery: Int, val maxBattery: Int, val alert: Int, val target: String?, val skills: List<Skill>, val radar: Radar? = null)
data class Challenge(val id: String, val kind: String, val params: JSONObject, val expiresAt: Long, val dual: Boolean = false)
data class Resources(val credits: Int = 0, val energy: Int = 0, val intel: Int = 0)
data class Outcome(val won: Boolean, val resources: Resources, val unlockedSkill: String?)

object Protocol {
    val skillNames = mapOf("SCANNER" to "Escáner de Pulso", "SABOTAGE" to "Sabotaje Óptico",
        "CAMOUFLAGE" to "Camuflaje de Señal", "HACK" to "Hackear", "OVERLOAD" to "Sobrecarga de Bóveda",
        "RADAR" to "Radar de Frecuencia", "EMP" to "Pulso PEM", "THERMAL" to "Visión Térmica",
        "TIMEDILATE" to "Dilatación Temporal")
    fun resources(json: JSONObject) = Resources(json.optInt("credits"), json.optInt("energy"), json.optInt("intel"))
    fun deck(json: JSONObject): Deck {
        val skills = json.getJSONArray("skills")
        return Deck(json.getInt("battery"), json.getInt("maxBattery").coerceAtLeast(1), json.getInt("alert"),
            if (json.isNull("nearTarget")) null else when (val target = json.get("nearTarget")) {
                is JSONObject -> target.getString("id")
                else -> target.toString()
            }, (0 until skills.length()).map { i -> skills.getJSONObject(i).let {
                Skill(it.getString("code"), it.getInt("cost"), it.getBoolean("available"), it.optString("reason").ifEmpty { null })
            } }, json.optJSONObject("radar")?.let {
                Radar(it.getDouble("bearingDegrees").toFloat(), it.getInt("distance").coerceAtLeast(0))
            })
    }
    fun challenge(json: JSONObject, dual: Boolean = false): Challenge {
        val params = json.getJSONObject("params")
        val kind = json.optString("minigame").ifEmpty { if (dual && params.has("sequence")) "SEQUENCE" else "" }
        require(kind in setOf("SEQUENCE", "FAST_SEQUENCE", "GLYPHS", "WAVES", "CORE_OVERLOAD")) { "Minijuego no compatible" }
        when (kind) {
            "SEQUENCE", "FAST_SEQUENCE" -> {
                val sequence = params.getJSONArray("sequence")
                require(sequence.length() in 1..32 && params.getLong("showMs") in 100..5000)
                require((0 until sequence.length()).all { sequence.getInt(it) in 0..3 })
            }
            "GLYPHS" -> {
                require(params.getInt("symbols") in 2..12)
                listOf("initial", "target").forEach { key ->
                    val values = params.getJSONArray(key)
                    require(values.length() == 3 && (0..2).all { values.getInt(it) in 0 until params.getInt("symbols") })
                }
            }
            "WAVES" -> { require(params.getLong("periodMs") in 500..10000); require(params.getDouble("phase").isFinite()) }
            "CORE_OVERLOAD" -> {
                require(params.getLong("durationMs") in 500..10000)
                require(params.getDouble("targetStart") in 0.0..1.0)
                require(params.getDouble("targetEnd") in params.getDouble("targetStart")..1.0)
            }
        }
        return Challenge(json.getString("challengeId"), kind, params, Instant.parse(json.getString("expiresAt")).toEpochMilli(), dual)
    }
    fun result(id: String, input: Any) = JSONObject().put("challengeId", id).put("input", input)
    fun sequence(values: List<Int>) = JSONArray(values)
}
