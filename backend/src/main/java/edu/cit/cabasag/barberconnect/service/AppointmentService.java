package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.observer.AppointmentEventManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import edu.cit.cabasag.barberconnect.dto.request.CreateAppointmentRequest;
import edu.cit.cabasag.barberconnect.model.Appointment;
import com.google.cloud.firestore.Firestore;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

/**
 * Behavioral Design Pattern Mechanism.
 * Triggers the Observer Subject (AppointmentEventManager) natively when business logic executes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentEventManager eventManager;
    private final FirebaseService firebaseService;

    public Appointment bookAppointment(CreateAppointmentRequest request) {
        log.info("Processing haircut booking for Customer {} with Barber {}", request.getCustomerId(), request.getBarberProfileId());
        
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");
            
            Appointment appointment = new Appointment();
            appointment.setAppointment_id(UUID.randomUUID().toString());
            appointment.setCustomer_id(request.getCustomerId());
            appointment.setBarber_profile_id(request.getBarberProfileId());
            appointment.setHaircut_style_id(request.getHaircutStyleId());
            
            // Parse ISO String from frontend using Instant to safely handle the 'Z' (UTC) timezone marker
            java.time.Instant instant = java.time.Instant.parse(request.getAppointmentDateTime());
            appointment.setAppointmentDateTime(Date.from(instant));
            
            appointment.setTotalPrice(request.getTotalPrice());
            
            try {
                appointment.setPaymentMethod(Appointment.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
            } catch (Exception e) {
                appointment.setPaymentMethod(Appointment.PaymentMethod.CASH); // Default fallback
            }
            
            appointment.setStatus(Appointment.AppointmentStatus.PENDING);
            appointment.setPaymentStatus(Appointment.PaymentStatus.PENDING);
            appointment.setSelectedOptionIds(request.getSelectedOptionIds());
            appointment.setCreatedAt(new Date());
            appointment.setUpdatedAt(new Date());
            
            // Write to Firestore db collection 'appointments'
            db.collection("appointments")
              .document(java.util.Objects.requireNonNull(appointment.getAppointment_id()))
              .set(appointment)
              .get();
              
            // Behavioral Pattern: Observer (Automatically triggers all subscribers without tight coupling)
            String notificationMessage = "Your appointment with Barber " + request.getBarberProfileId() + " is booked!";
            eventManager.notifyAll(request.getCustomerId(), notificationMessage);
            
            return appointment;
            
        } catch (InterruptedException | ExecutionException e) {
             log.error("Failed to book appointment in Firestore", e);
             throw new RuntimeException("Failed to save appointment", e);
        }
    }

    public java.util.List<Appointment> getAppointmentsByCustomerId(String customerId) {
        log.info("Fetching appointments for Customer ID: {}", customerId);
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            com.google.cloud.firestore.QuerySnapshot querySnapshot = db.collection("appointments")
                    .whereEqualTo("customer_id", customerId)
                    .get()
                    .get();

            return querySnapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Appointment.class))
                    .collect(java.util.stream.Collectors.toList());
                    
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to fetch appointments from Firestore", e);
            throw new RuntimeException("Failed to fetch appointments", e);
        }
    }

    public Appointment completeAppointment(String appointmentId) {
        log.info("Completing appointment: {} and processing income distribution.", appointmentId);
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // 1. Fetch Appointment
            com.google.cloud.firestore.DocumentSnapshot doc = db.collection("appointments").document(java.util.Objects.requireNonNull(appointmentId)).get().get();
            if (!doc.exists()) {
                throw new RuntimeException("Appointment not found");
            }
            Appointment appointment = doc.toObject(Appointment.class);
            if (appointment == null) throw new RuntimeException("Failed to map appointment");

            // 2. Compute 80/20 Split using precise BigDecimal math
            java.math.BigDecimal total = appointment.getTotalPrice();
            if (total == null) total = java.math.BigDecimal.ZERO;
            
            java.math.BigDecimal platformFee = total.multiply(new java.math.BigDecimal("0.20"));
            java.math.BigDecimal netAmount = total.multiply(new java.math.BigDecimal("0.80"));

            // 3. Generate Income Record
            edu.cit.cabasag.barberconnect.model.IncomeRecord incomeRecord = new edu.cit.cabasag.barberconnect.model.IncomeRecord();
            incomeRecord.setIncome_record_id(UUID.randomUUID().toString());
            incomeRecord.setBarber_profile_id(appointment.getBarber_profile_id());
            incomeRecord.setAppointment_id(appointment.getAppointment_id());
            incomeRecord.setAmount(total);
            incomeRecord.setPlatformFee(platformFee);
            incomeRecord.setNetAmount(netAmount);
            
            // Map payment method safely
            try {
                incomeRecord.setPaymentMethod(edu.cit.cabasag.barberconnect.model.IncomeRecord.PaymentMethod.valueOf(appointment.getPaymentMethod().name()));
            } catch (Exception e) {
                incomeRecord.setPaymentMethod(edu.cit.cabasag.barberconnect.model.IncomeRecord.PaymentMethod.CASH);
            }
            
            incomeRecord.setRecordedAt(LocalDateTime.now());

            // 4. Update Appointment Status
            appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
            appointment.setPaymentStatus(Appointment.PaymentStatus.PAID);
            appointment.setUpdatedAt(new Date());

            // 5. Commit to Firestore (Atomically-like)
            db.collection("income_records").document(java.util.Objects.requireNonNull(incomeRecord.getIncome_record_id())).set(incomeRecord);
            db.collection("appointments").document(java.util.Objects.requireNonNull(appointmentId)).set(appointment);

            String notificationMessage = "Appointment completed! " + netAmount + " added to your earnings.";
            eventManager.notifyAll(appointment.getBarber_profile_id(), notificationMessage);

            return appointment;

        } catch (Exception e) {
            log.error("Failed to process appointment completion", e);
            throw new RuntimeException("Failed to complete appointment and process income", e);
        }
    }
}
