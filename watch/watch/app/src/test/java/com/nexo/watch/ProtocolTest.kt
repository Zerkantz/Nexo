package com.nexo.watch

import com.nexo.watch.data.Protocol
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class ProtocolTest {
    @Test fun preservesServerCostsAndAvailability() {
        val deck = Protocol.deck(JSONObject("""{"battery":125,"maxBattery":150,"alert":50,"nearTarget":"DOOR_1","skills":[{"code":"EMP","cost":23,"available":false,"reason":"Sin objetivo"}]}"""))
        assertEquals(125, deck.battery)
        assertEquals(23, deck.skills.single().cost)
        assertFalse(deck.skills.single().available)
        assertEquals("DOOR_1", deck.target)
    }
    @Test fun serializesInputWithoutClaimingSuccess() {
        val result = Protocol.result("challenge-1", Protocol.sequence(listOf(2,0,3,1)))
        assertEquals("challenge-1", result.getString("challengeId"))
        assertEquals(2, result.getJSONArray("input").getInt(0))
        assertFalse(result.has("success"))
    }
    @Test fun parsesDualSequenceUsingExistingParams() {
        val challenge = Protocol.challenge(JSONObject("""{"challengeId":"dual","params":{"sequence":[2,0,3,1],"showMs":600},"expiresAt":"2030-01-01T00:00:00Z"}"""), true)
        assertTrue(challenge.dual)
        assertEquals("SEQUENCE", challenge.kind)
    }
    @Test(expected = IllegalArgumentException::class) fun rejectsInvalidNode() {
        Protocol.challenge(JSONObject("""{"challengeId":"bad","minigame":"SEQUENCE","params":{"sequence":[5],"showMs":600},"expiresAt":"2030-01-01T00:00:00Z"}"""))
    }
    @Test fun supportsNullTarget() {
        assertNull(Protocol.deck(JSONObject("""{"battery":0,"maxBattery":100,"alert":100,"nearTarget":null,"skills":[]}""")).target)
    }
}
