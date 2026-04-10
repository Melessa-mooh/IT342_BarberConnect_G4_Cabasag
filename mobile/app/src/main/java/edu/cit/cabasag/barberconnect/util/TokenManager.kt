package edu.cit.cabasag.barberconnect.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import edu.cit.cabasag.barberconnect.model.AuthResponse
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/** DataStore extension — one store per process */
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "barberconnect_prefs")

class TokenManager(private val context: Context) {

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("jwt_token")
        private val USER_KEY  = stringPreferencesKey("user_data")
    }

    // ── Write ──────────────────────────────────────────────────────────────

    suspend fun saveToken(token: String) {
        context.dataStore.edit { it[TOKEN_KEY] = token }
    }

    suspend fun saveUser(user: AuthResponse) {
        context.dataStore.edit { it[USER_KEY] = Gson().toJson(user) }
    }

    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }

    // ── Read ───────────────────────────────────────────────────────────────

    fun getToken(): Flow<String?> = context.dataStore.data.map { it[TOKEN_KEY] }

    fun getUser(): Flow<AuthResponse?> = context.dataStore.data.map { prefs ->
        prefs[USER_KEY]?.let {
            try { Gson().fromJson(it, AuthResponse::class.java) }
            catch (e: Exception) { null }
        }
    }
}
