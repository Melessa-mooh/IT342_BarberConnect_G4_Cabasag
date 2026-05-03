package edu.cit.cabasag.barberconnect.feature.appointment;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
 * Vertical Slice Architecture — Appointment Feature
 * Domain model representing a booking between a customer and barber.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    private String appointment_id;
    private String customer_id;
    private String barber_profile_id;
    private String haircut_style_id;
    private Date appointmentDateTime;
    private Integer durationMinutes;
    private BigDecimal totalPrice;
    private AppointmentStatus status = AppointmentStatus.PENDING;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    private String notes;
    private Date createdAt;
    private Date updatedAt;
    private List<String> selectedOptionIds;

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
