package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.observer.AppointmentEventManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import edu.cit.cabasag.barberconnect.dto.request.CreateAppointmentRequest;
import edu.cit.cabasag.barberconnect.model.Appointment;
import com.google.cloud.firestore.Firestore;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
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
            
            // Parse ISO String from frontend
            LocalDateTime ldt = LocalDateTime.parse(request.getAppointmentDateTime(), DateTimeFormatter.ISO_DATE_TIME);
            appointment.setAppointmentDateTime(Date.from(ldt.atZone(ZoneId.systemDefault()).toInstant()));
            
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
}
