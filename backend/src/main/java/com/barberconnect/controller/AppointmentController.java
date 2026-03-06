package com.barberconnect.controller;

import com.barberconnect.model.Appointment;
import com.barberconnect.repository.AppointmentRepository;
import com.barberconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments")
@CrossOrigin(origins = "http://localhost:3000")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Appointment>> getUserAppointments(
            @RequestParam UUID customerId) {
        return ResponseEntity.ok(appointmentRepository.findByCustomerId(customerId));
    }

    @GetMapping("/barber/{barberId}")
    public ResponseEntity<List<Appointment>> getBarberAppointments(
            @PathVariable UUID barberId) {
        return ResponseEntity.ok(appointmentRepository.findByBarberId(barberId));
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody Appointment appointment) {
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable UUID id,
            @RequestBody Appointment appointmentDetails) {
        return appointmentRepository.findById(id)
                .map(appointment -> {
                    if (appointmentDetails.getTotalPrice() != null) {
                        appointment.setTotalPrice(appointmentDetails.getTotalPrice());
                    }
                    if (appointmentDetails.getPaymentMethod() != null) {
                        appointment.setPaymentMethod(appointmentDetails.getPaymentMethod());
                    }
                    if (appointmentDetails.getStatus() != null) {
                        appointment.setStatus(appointmentDetails.getStatus());
                    }
                    if (appointmentDetails.getAppointmentDate() != null) {
                        appointment.setAppointmentDate(appointmentDetails.getAppointmentDate());
                    }
                    if (appointmentDetails.getAppointmentTime() != null) {
                        appointment.setAppointmentTime(appointmentDetails.getAppointmentTime());
                    }
                    return ResponseEntity.ok(appointmentRepository.save(appointment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAppointment(@PathVariable UUID id) {
        return appointmentRepository.findById(id)
                .map(appointment -> {
                    appointmentRepository.delete(appointment);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
