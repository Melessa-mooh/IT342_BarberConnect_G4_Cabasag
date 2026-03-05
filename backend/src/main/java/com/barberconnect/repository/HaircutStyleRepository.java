package com.barberconnect.repository;

import com.barberconnect.model.HaircutStyle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface HaircutStyleRepository extends JpaRepository<HaircutStyle, UUID> {
    List<HaircutStyle> findByBarberId(UUID barberId);
}
