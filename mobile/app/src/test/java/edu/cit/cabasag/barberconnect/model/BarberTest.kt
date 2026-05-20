package edu.cit.cabasag.barberconnect.model

import org.junit.Assert.*
import org.junit.Test

/**
 * TC-MOB-MODEL-01 through TC-MOB-MODEL-04
 * Pure data-class tests — no Android framework needed.
 */
class BarberTest {

    @Test
    fun `TC-MOB-MODEL-01 displayName returns trimmed full name`() {
        val barber = Barber(firstName = "Juan", lastName = "dela Cruz")
        assertEquals("Juan dela Cruz", barber.displayName())
    }

    @Test
    fun `TC-MOB-MODEL-02 displayName handles null firstName`() {
        val barber = Barber(firstName = null, lastName = "dela Cruz")
        assertEquals("dela Cruz", barber.displayName())
    }

    @Test
    fun `TC-MOB-MODEL-03 displayName handles null lastName`() {
        val barber = Barber(firstName = "Juan", lastName = null)
        assertEquals("Juan", barber.displayName())
    }

    @Test
    fun `TC-MOB-MODEL-04 displayName returns empty string when both null`() {
        val barber = Barber(firstName = null, lastName = null)
        assertEquals("", barber.displayName())
    }
}
