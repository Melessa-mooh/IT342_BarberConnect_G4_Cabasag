package com.barberconnect.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "barber_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BarberProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "phone")
    private String phone;

    @Column(name = "gcash_number")
    private String gcashNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
