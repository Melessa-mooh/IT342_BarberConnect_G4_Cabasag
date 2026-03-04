package com.barberconnect.repository;

import com.barberconnect.model.BarberProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BarberProfileRepository extends JpaRepository<BarberProfile, UUID> {
    Optional<BarberProfile> findByUserId(UUID userId);
}
