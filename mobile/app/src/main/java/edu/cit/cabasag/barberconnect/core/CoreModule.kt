package edu.cit.cabasag.barberconnect.core

import edu.cit.cabasag.barberconnect.BuildConfig

/**
 * Shared mobile infrastructure notes.
 *
 * RetrofitClient and ApiService are the real network source of truth. This
 * helper exposes the same generated BASE_URL so the mobile app cannot drift to
 * a different hardcoded backend.
 */
object CoreModule {
    const val MODULE_NAME = "core"
    val baseUrl: String
        get() = BuildConfig.BASE_URL
}
