package edu.cit.cabasag.barberconnect.adapter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Structural Design Pattern: Adapter (The Adaptee)
 * This simulates an external, highly uncooperative 3rd party SMS library
 * that doesn't follow our NotificationSender interface.
 */
@Component
@Slf4j
public class ThirdPartySmsApi {
    
    // Notice how the signature is completely different from what our domain wants
    public void transmitDataViaCarrier(Long phoneNumberInt, String payload) {
        log.info("[TWILIO/API SIMULATION] Transmitting SMS to {}: {}", phoneNumberInt, payload);
    }
}
