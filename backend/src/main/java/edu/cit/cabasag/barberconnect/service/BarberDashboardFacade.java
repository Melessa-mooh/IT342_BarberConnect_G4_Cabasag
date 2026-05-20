package edu.cit.cabasag.barberconnect.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Structural Facade Pattern.
 * Aggregates data from multiple Firestore collections into a single unified
 * dashboard payload so the controller only needs one call.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BarberDashboardFacade {

    private final BarberService barberService;
    private final FirebaseService firebaseService;

    public Map<String, Object> getAggregatedDashboardStats(String barberProfileId) {
        log.info("Facade aggregating data for Barber ID: {}", barberProfileId);

        // 1. Fetch profile via existing service
        AuthResponse.BarberProfileResponse profile = barberService.getBarberById(barberProfileId);

        // 2. Query real appointment and income data from Firestore
        long totalAppointments = 0;
        BigDecimal totalIncome = BigDecimal.ZERO;
        String averageRating = profile.getRating() != null ? profile.getRating() : "0.0";

        try {
            Firestore db = firebaseService.getFirestore();
            if (db != null) {
                // Count all appointments for this barber
                var apptSnap = db.collection("appointments")
                        .whereEqualTo("barber_profile_id", barberProfileId)
                        .get().get();
                totalAppointments = apptSnap.size();

                // Sum net income from income_records
                var incomeSnap = db.collection("income_records")
                        .whereEqualTo("barber_profile_id", barberProfileId)
                        .get().get();
                for (QueryDocumentSnapshot doc : incomeSnap.getDocuments()) {
                    Object netObj = doc.get("netAmount");
                    if (netObj instanceof Number) {
                        totalIncome = totalIncome.add(new BigDecimal(netObj.toString()));
                    }
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to aggregate dashboard stats for barber {}: {}", barberProfileId, e.getMessage());
        }

        // 3. Assemble unified payload
        Map<String, Object> unifiedDashboardData = new HashMap<>();
        unifiedDashboardData.put("profile", profile);
        unifiedDashboardData.put("totalAppointments", totalAppointments);
        unifiedDashboardData.put("totalIncome", totalIncome);
        unifiedDashboardData.put("averageRating", averageRating);

        return unifiedDashboardData;
    }
}
