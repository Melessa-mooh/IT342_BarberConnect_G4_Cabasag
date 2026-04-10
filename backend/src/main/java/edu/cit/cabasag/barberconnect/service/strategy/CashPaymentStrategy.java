package edu.cit.cabasag.barberconnect.service.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component("CASH")
public class CashPaymentStrategy implements PaymentStrategy {
    @Override
    public boolean processPayment(BigDecimal amount, String referenceId) {
        log.info("Processing CASH payment of {} for appointment {}", amount, referenceId);
        // Cash is usually paid in person, so logic assumes it's handled physically.
        return true;
    }

    @Override
    public String getPaymentMethodName() {
        return "Cash at Counter";
    }
}
