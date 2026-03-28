package edu.cit.cabasag.barberconnect.dto.request;

import edu.cit.cabasag.barberconnect.model.Appointment;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AppointmentRequest {

    @NotNull(message = "Barber ID is required")
    private Long barberId;

    @NotNull(message = "Haircut style ID is required")
    private Long haircutStyleId;

    @NotNull(message = "Appointment date and time is required")
    @Future(message = "Appointment must be in the future")
    private LocalDateTime appointmentDateTime;

    @NotNull(message = "Payment method is required")
    private Appointment.PaymentMethod paymentMethod;

    private List<Long> selectedOptionIds;

    private String notes;
}