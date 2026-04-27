package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.request.CreateAppointmentRequest;
import edu.cit.cabasag.barberconnect.model.Appointment;
import edu.cit.cabasag.barberconnect.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody CreateAppointmentRequest request) {
        try {
            Appointment appointment = appointmentService.bookAppointment(request);
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getCustomerAppointments(@PathVariable String customerId) {
        try {
            java.util.List<Appointment> appointments = appointmentService.getAppointmentsByCustomerId(customerId);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @PutMapping("/{appointmentId}/complete")
    public ResponseEntity<Appointment> completeAppointment(@PathVariable String appointmentId) {
        try {
            Appointment completedAppointment = appointmentService.completeAppointment(appointmentId);
            return ResponseEntity.ok(completedAppointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
