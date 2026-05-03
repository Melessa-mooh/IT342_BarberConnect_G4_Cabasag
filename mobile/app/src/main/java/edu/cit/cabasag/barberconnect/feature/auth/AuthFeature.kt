package edu.cit.cabasag.barberconnect.feature.auth

/**
 * Vertical Slice Architecture — Auth Feature
 *
 * This package groups all authentication-related classes:
 * - LoginActivity  (UI layer)
 * - RegisterActivity (UI layer)
 * - SplashActivity (UI layer — decides navigation based on auth state)
 * - AuthViewModel  (ViewModel layer)
 * - AuthRepository (Repository layer — wraps ApiService + TokenManager)
 *
 * Files are still referenced from their original locations for Android build compatibility,
 * but logically they belong to this feature slice.
 *
 * Cross-cutting dependencies:
 * - core.RetrofitClient    (network)
 * - core.TokenManager      (persistence)
 * - core.BarberConnectApp  (Application-level DI)
 */
object AuthFeature {
    const val FEATURE_NAME = "auth"
    const val LOGIN_ENDPOINT = "auth/login"
    const val REGISTER_ENDPOINT = "auth/register"
    const val FIREBASE_LOGIN_ENDPOINT = "auth/firebase-login"
    const val ME_ENDPOINT = "auth/me"
}
