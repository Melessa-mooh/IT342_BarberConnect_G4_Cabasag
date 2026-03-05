package com.barberconnect.repository;

import com.barberconnect.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface RatingRepository extends JpaRepository<Rating, UUID> {
    Optional<Rating> findByAppointmentId(UUID appointmentId);
    List<Rating> findByBarberId(UUID barberId);
    List<Rating> findByCustomerId(UUID customerId);
}
