package edu.cit.cabasag.barberconnect.dto.request;

import edu.cit.cabasag.barberconnect.model.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthRequest {
    
    @NotBlank(message = "ID token is required")
    private String idToken;
    
    @NotNull(message = "Role is required")
    private User.UserRole role;
}