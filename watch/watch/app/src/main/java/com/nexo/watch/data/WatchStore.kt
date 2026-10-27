package com.nexo.watch.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.watchStore by preferencesDataStore("nexo_watch")
data class SavedConnection(val url: String, val token: String, val sessionId: String)
class WatchStore(private val context: Context) {
    private val urlKey = stringPreferencesKey("server_url")
    private val tokenKey = stringPreferencesKey("watch_token")
    private val sessionKey = stringPreferencesKey("session_id")
    suspend fun load(): SavedConnection = context.watchStore.data.first().let {
        SavedConnection(it[urlKey].orEmpty(), it[tokenKey].orEmpty(), it[sessionKey].orEmpty())
    }
    suspend fun save(url: String, token: String) = context.watchStore.edit { it[urlKey] = url; it[tokenKey] = token }
    suspend fun session(id: String) = context.watchStore.edit { it[sessionKey] = id }
    suspend fun clearToken() = context.watchStore.edit { it.remove(tokenKey); it.remove(sessionKey) }
}
