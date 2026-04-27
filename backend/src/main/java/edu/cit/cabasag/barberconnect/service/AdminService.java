package edu.cit.cabasag.barberconnect.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.AggregateQuerySnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final FirebaseService firebaseService;

    public Map<String, Object> getShopStatistics() {
        Map<String, Object> stats = new HashMap<>();
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // 1. Total Appointments
            AggregateQuerySnapshot appointmentsSnapshot = db.collection("appointments")
                    .count()
                    .get()
                    .get();
            stats.put("totalAppointments", appointmentsSnapshot.getCount());

            // 2. Active Barbers
            AggregateQuerySnapshot barbersSnapshot = db.collection("users")
                    .whereEqualTo("role", "BARBER")
                    .whereEqualTo("isActive", true)
                    .count()
                    .get()
                    .get();
            stats.put("activeBarbers", barbersSnapshot.getCount());

            // 3. Total Customers
            AggregateQuerySnapshot customersSnapshot = db.collection("users")
                    .whereEqualTo("role", "CUSTOMER")
                    .count()
                    .get()
                    .get();
            stats.put("totalCustomers", customersSnapshot.getCount());

            // Calculate Total Revenue (sum of all COMPLETED appointments)
            QuerySnapshot revenueSnapshot = db.collection("appointments")
                    .whereEqualTo("status", "COMPLETED")
                    .get()
                    .get();
            double totalRevenue = 0.0;
            for (QueryDocumentSnapshot doc : revenueSnapshot.getDocuments()) {
                Double price = doc.getDouble("totalPrice");
                if (price != null) {
                    totalRevenue += price;
                }
            }
            stats.put("totalRevenue", totalRevenue);

            return stats;

        } catch (Exception e) {
            log.error("Failed to aggregate shop statistics: {}", e.getMessage());
            // Return safe fallback gracefully
            stats.put("totalAppointments", 0);
            stats.put("activeBarbers", 0);
            stats.put("totalCustomers", 0);
            stats.put("totalRevenue", 0);
            return stats;
        }
    }
}
