package com.barberconnect.dto;

import com.barberconnect.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String role;

    public UserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.role = user.getRole().toString();
    }
}
