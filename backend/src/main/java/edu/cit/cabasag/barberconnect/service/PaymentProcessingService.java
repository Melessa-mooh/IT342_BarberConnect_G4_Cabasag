package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.model.Appointment.PaymentMethod;
import edu.cit.cabasag.barberconnect.service.strategy.PaymentStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentProcessingService {

    // Spring Boot automatically injects all PaymentStrategy implementations into this map!
    // The key is the Spring Bean name (which we explicitly set to e.g., "CASH" or "DIGITAL_WALLET")
    private final Map<String, PaymentStrategy> paymentStrategies;

    public boolean checkoutAppointment(PaymentMethod method, BigDecimal amount, String appointmentId) {
        // Here we apply the Strategy Pattern. We avoid using massive switch/if-else statements.
        // We dynamically select the exact algorithm based on the Enum name at runtime.
        PaymentStrategy strategy = paymentStrategies.get(method.name());
        
        if (strategy == null) {
            log.error("No valid payment strategy found for method: {}", method.name());
            throw new IllegalArgumentException("Unsupported Payment Method");
        }
        
        log.info("Executing Strategy: {}", strategy.getPaymentMethodName());
        return strategy.processPayment(amount, appointmentId);
    }
}
