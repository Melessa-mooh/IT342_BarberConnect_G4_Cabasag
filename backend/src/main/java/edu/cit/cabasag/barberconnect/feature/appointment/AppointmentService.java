package edu.cit.cabasag.barberconnect.feature.appointment;

import edu.cit.cabasag.barberconnect.feature.shared.FirebaseService;
import edu.cit.cabasag.barberconnect.dto.request.CreateAppointmentRequest;

import edu.cit.cabasag.barberconnect.observer.AppointmentEventManager;
import com.google.cloud.firestore.Firestore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;


import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Vertical Slice Architecture — Appointment Feature
 * Handles all appointment lifecycle: booking, status updates, and income generation.
 */
@Service("featureAppointmentService")
@Primary
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentEventManager eventManager;
    private final FirebaseService firebaseService;

    public edu.cit.cabasag.barberconnect.model.Appointment bookAppointment(CreateAppointmentRequest request) {
        log.info("Processing booking for Customer {} with Barber {}", request.getCustomerId(), request.getBarberProfileId());
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            edu.cit.cabasag.barberconnect.model.Appointment appointment = new edu.cit.cabasag.barberconnect.model.Appointment();
            appointment.setAppointment_id(UUID.randomUUID().toString());
            appointment.setCustomer_id(request.getCustomerId());
            appointment.setBarber_profile_id(request.getBarberProfileId());
            appointment.setHaircut_style_id(request.getHaircutStyleId());

            java.time.Instant instant = java.time.Instant.parse(request.getAppointmentDateTime());
            appointment.setAppointmentDateTime(Date.from(instant));
            appointment.setTotalPrice(request.getTotalPrice());

            try {
                appointment.setPaymentMethod(edu.cit.cabasag.barberconnect.model.Appointment.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
            } catch (Exception e) {
                appointment.setPaymentMethod(edu.cit.cabasag.barberconnect.model.Appointment.PaymentMethod.CASH);
            }

            appointment.setStatus(edu.cit.cabasag.barberconnect.model.Appointment.AppointmentStatus.PENDING);
            appointment.setPaymentStatus(edu.cit.cabasag.barberconnect.model.Appointment.PaymentStatus.PENDING);
            appointment.setSelectedOptionIds(request.getSelectedOptionIds());
            appointment.setCreatedAt(new Date());
            appointment.setUpdatedAt(new Date());

            db.collection("appointments")
              .document(java.util.Objects.requireNonNull(appointment.getAppointment_id()))
              .set(appointment).get();

            String msg = "Your appointment with Barber " + request.getBarberProfileId() + " is booked!";
            eventManager.notifyAll(request.getCustomerId(), msg);

            return appointment;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to book appointment in Firestore", e);
            throw new RuntimeException("Failed to save appointment", e);
        }
    }

    public List<edu.cit.cabasag.barberconnect.model.Appointment> getAppointmentsByBarberProfileId(String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            return db.collection("appointments")
                    .whereEqualTo("barber_profile_id", barberProfileId)
                    .orderBy("appointmentDateTime", com.google.cloud.firestore.Query.Direction.DESCENDING)
                    .get().get().getDocuments().stream()
                    .map(doc -> doc.toObject(edu.cit.cabasag.barberconnect.model.Appointment.class))
                    .collect(Collectors.toList());

        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to fetch appointments for barber", e);
        }
    }

    public edu.cit.cabasag.barberconnect.model.Appointment updateAppointmentStatus(String appointmentId, String status) {
        log.info("Updating appointment {} to status {}", appointmentId, status);
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            var docRef = db.collection("appointments").document(java.util.Objects.requireNonNull(appointmentId));
            var doc = docRef.get().get();
            if (!doc.exists()) throw new RuntimeException("Appointment not found");

            docRef.update("status", status).get();

            edu.cit.cabasag.barberconnect.model.Appointment updated = doc.toObject(edu.cit.cabasag.barberconnect.model.Appointment.class);
            if (updated != null) {
                updated.setStatus(edu.cit.cabasag.barberconnect.model.Appointment.AppointmentStatus.valueOf(status));
            }
            return updated;

        } catch (Exception e) {
            log.error("Failed to update appointment status", e);
            throw new RuntimeException("DB Error", e);
        }
    }
}
