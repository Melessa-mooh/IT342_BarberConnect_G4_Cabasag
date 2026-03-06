package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {
    
    private String appointment_id;
    private String customer_id; // Reference to User user_id
    private String barber_profile_id; // Reference to BarberProfile barber_profile_id
    private String haircut_style_id; // Reference to HaircutStyle haircut_style_id
    private LocalDateTime appointmentDateTime;
    private Integer durationMinutes;
    private BigDecimal totalPrice;
    private AppointmentStatus status = AppointmentStatus.PENDING;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // References to related data
    private List<String> selectedOptionIds; // References to StyleOption style_option_ids
    
    public enum AppointmentStatus {
        PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
    }
    
    public enum PaymentMethod {
        CASH, CARD, DIGITAL_WALLET
    }
    
    public enum PaymentStatus {
        PENDING, PAID, REFUNDED, FAILED
    }
}