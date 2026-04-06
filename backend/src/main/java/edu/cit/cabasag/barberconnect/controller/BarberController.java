package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.service.BarberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/barbers")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class BarberController {
    
    private final BarberService barberService;
    
    @GetMapping("/public/available")
    public ResponseEntity<ApiResponse<List<AuthResponse.BarberProfileResponse>>> getAvailableBarbers() {
        try {
            List<AuthResponse.BarberProfileResponse> barbers = barberService.getAllAvailableBarbers();
            return ResponseEntity.ok(ApiResponse.success(barbers));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResponse<AuthResponse.BarberProfileResponse>> getBarberById(@PathVariable String id) {
        try {
            AuthResponse.BarberProfileResponse barber = barberService.getBarberById(id);
            return ResponseEntity.ok(ApiResponse.success(barber));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<AuthResponse.BarberProfileResponse>> updateBarberProfile(
            @PathVariable String userId,
            @RequestBody edu.cit.cabasag.barberconnect.dto.request.UpdateBarberProfileRequest request) {
        try {
            AuthResponse.BarberProfileResponse updatedProfile = barberService.updateProfile(userId, request);
            return ResponseEntity.ok(ApiResponse.success(updatedProfile));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}