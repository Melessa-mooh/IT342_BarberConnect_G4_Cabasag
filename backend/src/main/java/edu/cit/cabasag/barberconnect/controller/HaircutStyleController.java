package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.feature.catalog.HaircutStyle;
import edu.cit.cabasag.barberconnect.feature.catalog.StyleOption;
import edu.cit.cabasag.barberconnect.service.HaircutStyleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/haircuts")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class HaircutStyleController {

    private final HaircutStyleService haircutStyleService;

    @PostMapping(produces = "application/json")
    @PreAuthorize("hasRole('BARBER')")
    public ResponseEntity<ApiResponse<HaircutStyle>> createHaircutStyle(
            @RequestParam("barberProfileId") String barberProfileId,
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false, defaultValue = "") String description,
            @RequestParam("basePrice") BigDecimal basePrice,
            @RequestParam(value = "durationMinutes", required = false) Integer durationMinutes,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            if (barberProfileId == null || barberProfileId.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("barberProfileId is required"));
            }
            if (name == null || name.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("name is required"));
            }
            if (basePrice == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("basePrice is required"));
            }
            HaircutStyle style = haircutStyleService.createHaircutStyle(barberProfileId, name, description, basePrice, durationMinutes, file);
            return ResponseEntity.ok(ApiResponse.success(style));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Create failed: " + e.getMessage()));
        }
    }

    @GetMapping("/barber/{barberProfileId}")
    public ResponseEntity<ApiResponse<List<HaircutStyle>>> getHaircutStylesForBarber(@PathVariable String barberProfileId) {
        try {
            List<HaircutStyle> styles = haircutStyleService.getHaircutStylesForBarber(barberProfileId);
            return ResponseEntity.ok(ApiResponse.success(styles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Public: get a single haircut style by ID — used by barber popup to resolve style name */
    @GetMapping("/{haircutStyleId}")
    public ResponseEntity<ApiResponse<HaircutStyle>> getHaircutStyleById(@PathVariable String haircutStyleId) {
        try {
            com.google.cloud.firestore.Firestore db = haircutStyleService.getFirestore();
            if (db == null) return ResponseEntity.badRequest().body(ApiResponse.error("Firestore not available"));
            var snap = db.collection("haircut_styles").document(haircutStyleId).get().get();
            if (!snap.exists()) return ResponseEntity.badRequest().body(ApiResponse.error("Style not found"));
            HaircutStyle style = snap.toObject(HaircutStyle.class);
            return ResponseEntity.ok(ApiResponse.success(style));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Wait, the instructions say the request body is JSON.
    // "1. POST /haircuts
    // - Request body: { "barberProfileId": "", "name": "", "description": "", "basePrice": 0.0, "durationMinutes": 0 }
    // - Optional multipart file for image upload..."
    // If it's multipart file, the frontend must use FormData, so the Spring Controller expects @ModelAttribute or @RequestParam, not @RequestBody.
    // I will use @RequestParam as I did above.

    // For PUT, the prompt says "Request body: { "name": "", "description": "", ... }"
    // So I will create an inner class DTO for the request body for PUT and POST options.

    public static class UpdateHaircutStyleRequest {
        public String name;
        public String description;
        public BigDecimal basePrice;
        public Integer durationMinutes;
    }

    @PutMapping("/{haircutStyleId}")
    @PreAuthorize("hasRole('BARBER')")
    public ResponseEntity<ApiResponse<HaircutStyle>> updateHaircutStyle(
            @PathVariable String haircutStyleId,
            @RequestBody UpdateHaircutStyleRequest request) {
        try {
            HaircutStyle style = haircutStyleService.updateHaircutStyle(haircutStyleId, request.name, request.description, request.basePrice, request.durationMinutes);
            return ResponseEntity.ok(ApiResponse.success(style));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{haircutStyleId}")
    @PreAuthorize("hasRole('BARBER')")
    public ResponseEntity<ApiResponse<String>> deleteHaircutStyle(@PathVariable String haircutStyleId) {
        try {
            haircutStyleService.deleteHaircutStyle(haircutStyleId);
            return ResponseEntity.ok(ApiResponse.success("Haircut style deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    public static class CreateStyleOptionRequest {
        public String name;
        public String description;
        public BigDecimal additionalPrice;
        public Integer additionalTimeMinutes;
    }

    @PostMapping("/{haircutStyleId}/options")
    @PreAuthorize("hasRole('BARBER')")
    public ResponseEntity<ApiResponse<StyleOption>> createStyleOption(
            @PathVariable String haircutStyleId,
            @RequestBody CreateStyleOptionRequest request) {
        try {
            StyleOption option = haircutStyleService.createStyleOption(haircutStyleId, request.name, request.description, request.additionalPrice, request.additionalTimeMinutes);
            return ResponseEntity.ok(ApiResponse.success(option));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{haircutStyleId}/options")
    public ResponseEntity<ApiResponse<List<StyleOption>>> getStyleOptionsForHaircut(@PathVariable String haircutStyleId) {
        try {
            List<StyleOption> options = haircutStyleService.getStyleOptionsForHaircut(haircutStyleId);
            return ResponseEntity.ok(ApiResponse.success(options));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/options/{styleOptionId}")
    @PreAuthorize("hasRole('BARBER')")
    public ResponseEntity<ApiResponse<String>> deleteStyleOption(@PathVariable String styleOptionId) {
        try {
            haircutStyleService.deleteStyleOption(styleOptionId);
            return ResponseEntity.ok(ApiResponse.success("Style option deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
