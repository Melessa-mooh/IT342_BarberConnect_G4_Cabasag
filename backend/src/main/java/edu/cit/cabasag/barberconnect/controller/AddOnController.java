package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Provides the global shop-level add-on services menu.
 * These are optional extras a customer can add to any appointment.
 */
@RestController
@RequestMapping("/addons")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AddOnController {

    /** Returns all global add-on categories and their services. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAddOns() {
        List<Map<String, Object>> categories = buildAddOns();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    private List<Map<String, Object>> buildAddOns() {
        return List.of(
            category("Grooming & Detailing", List.of(
                addon("addon-gd-1",  "Beard / Mustache Trim",       350),
                addon("addon-gd-2",  "Signature Shave (Hot Towel)", 650),
                addon("addon-gd-3",  "Line-Up / Edge-Up",           200),
                addon("addon-gd-4",  "Eyebrow Threading",           200),
                addon("addon-gd-5",  "Ear Cleaning",                450),
                addon("addon-gd-6",  "Nose/Ear Waxing",             300)
            )),
            category("Hair Color & Chemical Services", List.of(
                addon("addon-hc-1",  "Full Hair Color",             2600),
                addon("addon-hc-2",  "Root Retouch",                1600),
                addon("addon-hc-3",  "Gray Blending",               2000),
                addon("addon-hc-4",  "Highlights / Frosting",       2800),
                addon("addon-hc-5",  "Hair Rebonding",              6000),
                addon("addon-hc-6",  "Hair Relax",                  3000),
                addon("addon-hc-7",  "Beard Dye",                   1200),
                addon("addon-hc-8",  "Perming",                     2500)
            )),
            category("Treatments & Spa Add-ons", List.of(
                addon("addon-ts-1",  "Scalp & Head Massage",         450),
                addon("addon-ts-2",  "Hair Spa / Treatment",        1150),
                addon("addon-ts-3",  "Anti-Dandruff Treatment",     1700),
                addon("addon-ts-4",  "Brazilian Blowout",           3750),
                addon("addon-ts-5",  "Signature Facial",            1000),
                addon("addon-ts-6",  "Blackhead Removal Mask",       500)
            )),
            category("Specialty Add-ons", List.of(
                addon("addon-sp-1",  "Hair Tattoo / Design",         500),
                addon("addon-sp-2",  "Deep Conditioning Mask",       800),
                addon("addon-sp-3",  "Scalp Detox Scrub",            900),
                addon("addon-sp-4",  "Post-Service Shampoo",         150)
            ))
        );
    }

    private Map<String, Object> category(String name, List<Map<String, Object>> items) {
        return Map.of("category", name, "items", items);
    }

    private Map<String, Object> addon(String id, String name, int price) {
        return Map.of("id", id, "name", name, "price", price);
    }
}
