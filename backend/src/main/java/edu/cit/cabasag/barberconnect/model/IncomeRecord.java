package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncomeRecord {
    
    private String income_record_id;
    private String barber_profile_id; // Reference to BarberProfile barber_profile_id
    private String appointment_id; // Reference to Appointment appointment_id
    private BigDecimal amount;
    private BigDecimal platformFee;
    private BigDecimal netAmount;
    private PaymentMethod paymentMethod;
    private LocalDateTime recordedAt;
    
    public enum PaymentMethod {
        CASH, CARD, DIGITAL_WALLET
    }
}