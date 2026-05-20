package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.request.CreateAppointmentRequest;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.feature.appointment.Appointment;
import edu.cit.cabasag.barberconnect.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"})
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/book")
    public ResponseEntity<ApiResponse<Appointment>> bookAppointment(@RequestBody CreateAppointmentRequest request) {
        try {
            Appointment appointment = appointmentService.bookAppointment(request);
            return ResponseEntity.ok(ApiResponse.success(appointment));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getCustomerAppointments(@PathVariable String customerId) {
        try {
            List<Appointment> appointments = appointmentService.getAppointmentsByCustomerId(customerId);
            return ResponseEntity.ok(ApiResponse.success(appointments));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @GetMapping("/barber/{barberProfileId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getBarberAppointments(@PathVariable String barberProfileId) {
        try {
            List<Appointment> appointments = appointmentService.getAppointmentsByBarberProfileId(barberProfileId);
            return ResponseEntity.ok(ApiResponse.success(appointments));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @PutMapping("/{appointmentId}/complete")
    public ResponseEntity<ApiResponse<Appointment>> completeAppointment(@PathVariable String appointmentId) {
        try {
            Appointment completedAppointment = appointmentService.completeAppointment(appointmentId);
            return ResponseEntity.ok(ApiResponse.success(completedAppointment));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{appointmentId}/status")
    public ResponseEntity<ApiResponse<Appointment>> updateAppointmentStatus(
            @PathVariable String appointmentId,
            @RequestBody java.util.Map<String, String> body) {
        try {
            String status = body.get("status");
            Appointment updated = appointmentService.updateAppointmentStatus(appointmentId, status);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<ApiResponse<Appointment>> cancelAppointment(@PathVariable String appointmentId) {
        try {
            Appointment updated = appointmentService.updateAppointmentStatus(appointmentId, "CANCELLED");
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{appointmentId}/no-show")
    public ResponseEntity<ApiResponse<Appointment>> markNoShow(@PathVariable String appointmentId) {
        try {
            Appointment updated = appointmentService.updateAppointmentStatus(appointmentId, "NO_SHOW");
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
