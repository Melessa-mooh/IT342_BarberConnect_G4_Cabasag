package edu.cit.cabasag.barberconnect.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBarberProfileRequest {
    private String phone;
    private String bio;
    private Integer experience;
    private String gcash;
}
