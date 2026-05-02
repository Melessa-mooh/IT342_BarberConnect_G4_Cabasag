package edu.cit.cabasag.barberconnect.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Request body for POST /api/v1/admin/barbers/create
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateBarberRequest {

    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
}
