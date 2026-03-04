package com.barberconnect.controller;

import com.barberconnect.model.Rating;
import com.barberconnect.repository.RatingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/ratings")
@CrossOrigin(origins = "http://localhost:3000")
public class RatingController {

    @Autowired
    private RatingRepository ratingRepository;

    @GetMapping
    public ResponseEntity<List<Rating>> getAllRatings() {
        return ResponseEntity.ok(ratingRepository.findAll());
    }

    @GetMapping("/barber/{barberId}")
    public ResponseEntity<List<Rating>> getBarberRatings(@PathVariable UUID barberId) {
        return ResponseEntity.ok(ratingRepository.findByBarberId(barberId));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Rating>> getCustomerRatings(@PathVariable UUID customerId) {
        return ResponseEntity.ok(ratingRepository.findByCustomerId(customerId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<Rating> getAppointmentRating(@PathVariable UUID appointmentId) {
        return ratingRepository.findByAppointmentId(appointmentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Rating> createRating(@RequestBody Rating rating) {
        return ResponseEntity.ok(ratingRepository.save(rating));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rating> updateRating(
            @PathVariable UUID id,
            @RequestBody Rating ratingDetails) {
        return ratingRepository.findById(id)
                .map(rating -> {
                    if (ratingDetails.getStars() != null) {
                        rating.setStars(ratingDetails.getStars());
                    }
                    if (ratingDetails.getComment() != null) {
                        rating.setComment(ratingDetails.getComment());
                    }
                    return ResponseEntity.ok(ratingRepository.save(rating));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRating(@PathVariable UUID id) {
        return ratingRepository.findById(id)
                .map(rating -> {
                    ratingRepository.delete(rating);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
