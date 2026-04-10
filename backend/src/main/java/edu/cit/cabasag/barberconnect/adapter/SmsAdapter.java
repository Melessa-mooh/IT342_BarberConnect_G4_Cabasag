package edu.cit.cabasag.barberconnect.adapter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Structural Design Pattern: Adapter
 * Bridges our clean NotificationSender interface to the clunky ThirdPartySmsApi.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SmsAdapter implements NotificationSender {

    private final ThirdPartySmsApi thirdPartySmsApi;

    @Override
    public void sendNotification(String userId, String message) {
        // In a real scenario, we would lookup the user's phone number by userId.
        // For demonstration of the adapter translating data types:
        log.info("Adapter converting userId String to Third Party Long format...");
        try {
            Long dummyPhone = 639123456789L; // Mock translation
            thirdPartySmsApi.transmitDataViaCarrier(dummyPhone, "[BarberConnect] " + message);
        } catch (Exception e) {
            log.error("Adapter failed to translate and send SMS");
        }
    }
}
