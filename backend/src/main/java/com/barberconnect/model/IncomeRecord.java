package com.barberconnect.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "income_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncomeRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @ManyToOne
    @JoinColumn(name = "barber_id")
    private User barber;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "barber_share")
    private BigDecimal barberShare;

    @Column(name = "owner_share")
    private BigDecimal ownerShare;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
