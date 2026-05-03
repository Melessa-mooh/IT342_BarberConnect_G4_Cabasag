package edu.cit.cabasag.barberconnect.core

/**
 * Vertical Slice Architecture — Core / Shared Infrastructure
 *
 * This package groups all cross-cutting infrastructure shared across all feature slices:
 * - RetrofitClient    (OkHttp + Retrofit network layer with JWT interceptor)
 * - ApiService        (Retrofit interface — defines all HTTP endpoints)
 * - TokenManager      (DataStore-backed JWT & user session persistence)
 * - BarberConnectApp  (Application-level dependency injection container)
 *
 * No feature-specific business logic lives here.
 * All feature slices depend on core, but core has no dependencies on any feature.
 */
object CoreModule {
    const val MODULE_NAME = "core"
    const val BASE_URL_DEBUG = "http://192.168.1.47:8080/api/v1/"
    const val BASE_URL_RELEASE = "https://your-production-url.com/api/v1/"
}
