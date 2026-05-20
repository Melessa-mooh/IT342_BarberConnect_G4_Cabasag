package edu.cit.cabasag.barberconnect.model

import org.junit.Assert.*
import org.junit.Test

/**
 * TC-MOB-MODEL-05 through TC-MOB-MODEL-08
 */
class AuthResponseTest {

    @Test
    fun `TC-MOB-MODEL-05 displayName returns first and last initial`() {
        val user = AuthResponse(firstName = "Juan", lastName = "dela Cruz")
        assertEquals("Juan d.", user.displayName())
    }

    @Test
    fun `TC-MOB-MODEL-06 initials returns uppercase first letters`() {
        val user = AuthResponse(firstName = "Juan", lastName = "dela Cruz")
        assertEquals("JD", user.initials())
    }

    @Test
    fun `TC-MOB-MODEL-07 initials returns question marks when names are null`() {
        val user = AuthResponse(firstName = null, lastName = null)
        assertEquals("??", user.initials())
    }

    @Test
    fun `TC-MOB-MODEL-08 barberProfile is null by default`() {
        val user = AuthResponse(email = "test@test.com")
        assertNull(user.barberProfile)
    }
}
