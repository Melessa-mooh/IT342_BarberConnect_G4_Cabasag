package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.observer.AppointmentEventManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Behavioral Design Pattern Mechanism.
 * Triggers the Observer Subject (AppointmentEventManager) natively when business logic executes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentEventManager eventManager;

    public void bookAppointment(String customerId, String barberId, String dateString) {
        log.info("Processing haircut booking for Customer {} with Barber {} on {}", customerId, barberId, dateString);
        
        // Complex booking logic with Firestore would exist here
        
        // Behavioral Pattern: Observer (Automatically triggers all subscribers without tight coupling)
        String notificationMessage = "Your appointment with Barber " + barberId + " is booked for: " + dateString;
        eventManager.notifyAll(customerId, notificationMessage);
    }
}
