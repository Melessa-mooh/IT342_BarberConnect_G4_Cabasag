package com.barberconnect.repository;

import com.barberconnect.model.IncomeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface IncomeRecordRepository extends JpaRepository<IncomeRecord, UUID> {
    Optional<IncomeRecord> findByAppointmentId(UUID appointmentId);
    List<IncomeRecord> findByBarberId(UUID barberId);
}
