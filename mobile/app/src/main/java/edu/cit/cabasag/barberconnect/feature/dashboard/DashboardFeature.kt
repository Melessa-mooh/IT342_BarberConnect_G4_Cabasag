package edu.cit.cabasag.barberconnect.feature.dashboard

/**
 * Vertical Slice Architecture — Dashboard Feature
 *
 * This package groups all barber dashboard-related classes:
 * - DashboardActivity (UI layer)
 * - DashboardViewModel (ViewModel layer — fetches barber info via UserService/ApiService)
 *
 * The dashboard is the main landing screen for authenticated BARBER users.
 * It provides navigation into sub-features (appointments, profile, etc.)
 */
object DashboardFeature {
    const val FEATURE_NAME = "dashboard"
}
