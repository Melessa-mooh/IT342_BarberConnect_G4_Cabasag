package edu.cit.cabasag.barberconnect.service.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component("DIGITAL_WALLET")
public class DigitalWalletPaymentStrategy implements PaymentStrategy {
    @Override
    public boolean processPayment(BigDecimal amount, String referenceId) {
        log.info("Contacting external Digital Wallet Gateway (GCash/Maya) for {} reference: {}", amount, referenceId);
        // Logic to ping GCash/Maya API goes here...
        return true;
    }

    @Override
    public String getPaymentMethodName() {
        return "Digital Wallet (GCash/Maya)";
    }
}
