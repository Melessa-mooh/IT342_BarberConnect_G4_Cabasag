package com.barberconnect.controller;

import com.barberconnect.model.BarberProfile;
import com.barberconnect.model.HaircutStyle;
import com.barberconnect.model.User;
import com.barberconnect.repository.BarberProfileRepository;
import com.barberconnect.repository.HaircutStyleRepository;
import com.barberconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/barbers")
@CrossOrigin(origins = "http://localhost:3000")
public class BarberController {

    @Autowired
    private BarberProfileRepository barberProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HaircutStyleRepository haircutStyleRepository;

    @GetMapping
    public ResponseEntity<List<BarberProfile>> getAllBarbers() {
        return ResponseEntity.ok(barberProfileRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BarberProfile> getBarberById(@PathVariable UUID id) {
        return barberProfileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/styles")
    public ResponseEntity<List<HaircutStyle>> getBarberStyles(@PathVariable UUID id) {
        List<HaircutStyle> styles = haircutStyleRepository.findByBarberId(id);
        return ResponseEntity.ok(styles);
    }

    @PostMapping("/{id}/styles")
    public ResponseEntity<HaircutStyle> addHaircutStyle(
            @PathVariable UUID id,
            @RequestBody HaircutStyle style) {
        User barber = userRepository.findById(id)
                .orElse(null);
        if (barber == null) {
            return ResponseEntity.notFound().build();
        }
        style.setBarber(barber);
        return ResponseEntity.ok(haircutStyleRepository.save(style));
    }
}
