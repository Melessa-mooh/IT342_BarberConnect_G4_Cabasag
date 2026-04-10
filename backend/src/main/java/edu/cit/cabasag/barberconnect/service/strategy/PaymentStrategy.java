package edu.cit.cabasag.barberconnect.service.strategy;

import java.math.BigDecimal;

/**
 * Strategy Pattern Interface for defining a family of payment algorithms.
 */
public interface PaymentStrategy {
    boolean processPayment(BigDecimal amount, String referenceId);
    String getPaymentMethodName();
}
