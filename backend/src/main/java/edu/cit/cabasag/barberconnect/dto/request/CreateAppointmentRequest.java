package edu.cit.cabasag.barberconnect.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {
    private String customerId;
    private String barberProfileId;
    private String haircutStyleId;
    private String appointmentDateTime; // ISO-8601 string from frontend
    private BigDecimal totalPrice;
    private String paymentMethod; // CASH, CARD, DIGITAL_WALLET
    private List<String> selectedOptionIds;
}
