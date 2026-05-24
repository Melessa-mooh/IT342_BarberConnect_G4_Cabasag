package edu.cit.cabasag.barberconnect.feature.income;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

/**
 * Vertical Slice Architecture — Income Feature
 * Domain model representing a financial record after appointment completion.
 * Follows the 80/20 split: barber receives 80%, platform retains 20%.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncomeRecord {

    private String income_record_id;
    private String barber_profile_id;
    private String appointment_id;
    private String customerId;
    private String customerFullName;
    private String barberFullName;
    private String serviceName;
    private BigDecimal amount;
    private BigDecimal platformFee;    // 20%
    private BigDecimal netAmount;      // 80%
    private PaymentMethod paymentMethod;
    private String paymentStatus;
    private String recordedAt;

    public enum PaymentMethod {
        CASH, CARD, DIGITAL_WALLET
    }
}
