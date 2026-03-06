package com.barberconnect.controller;

import com.barberconnect.model.IncomeRecord;
import com.barberconnect.repository.IncomeRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/income-records")
@CrossOrigin(origins = "http://localhost:3000")
public class IncomeRecordController {

    @Autowired
    private IncomeRecordRepository incomeRecordRepository;

    @GetMapping
    public ResponseEntity<List<IncomeRecord>> getAllRecords() {
        return ResponseEntity.ok(incomeRecordRepository.findAll());
    }

    @GetMapping("/barber/{barberId}")
    public ResponseEntity<List<IncomeRecord>> getBarberIncomeRecords(@PathVariable UUID barberId) {
        return ResponseEntity.ok(incomeRecordRepository.findByBarberId(barberId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<IncomeRecord> getAppointmentIncomeRecord(@PathVariable UUID appointmentId) {
        return incomeRecordRepository.findByAppointmentId(appointmentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<IncomeRecord> createIncomeRecord(@RequestBody IncomeRecord incomeRecord) {
        return ResponseEntity.ok(incomeRecordRepository.save(incomeRecord));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncomeRecord> updateIncomeRecord(
            @PathVariable UUID id,
            @RequestBody IncomeRecord recordDetails) {
        return incomeRecordRepository.findById(id)
                .map(record -> {
                    if (recordDetails.getTotalAmount() != null) {
                        record.setTotalAmount(recordDetails.getTotalAmount());
                    }
                    if (recordDetails.getBarberShare() != null) {
                        record.setBarberShare(recordDetails.getBarberShare());
                    }
                    if (recordDetails.getOwnerShare() != null) {
                        record.setOwnerShare(recordDetails.getOwnerShare());
                    }
                    return ResponseEntity.ok(incomeRecordRepository.save(record));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIncomeRecord(@PathVariable UUID id) {
        return incomeRecordRepository.findById(id)
                .map(record -> {
                    incomeRecordRepository.delete(record);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
