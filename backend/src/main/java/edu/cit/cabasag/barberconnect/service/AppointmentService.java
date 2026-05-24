package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.observer.AppointmentEventManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import edu.cit.cabasag.barberconnect.dto.request.CreateAppointmentRequest;
import edu.cit.cabasag.barberconnect.feature.appointment.Appointment;
import edu.cit.cabasag.barberconnect.feature.income.IncomeRecord;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentSnapshot;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Objects;
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

            // Extract the date portion from the appointment datetime
            java.time.LocalDate appointmentDate = instant.atZone(java.time.ZoneId.of("Asia/Manila")).toLocalDate();
            String appointmentDateStr = appointmentDate.toString(); // "yyyy-MM-dd"

            // Check if barber has an APPROVED leave on this date.
            // Single-field query to avoid requiring a composite Firestore index;
            // status and date are filtered in Java.
            com.google.cloud.firestore.QuerySnapshot leaveSnap = db.collection("leave_requests")
                .whereEqualTo("barberProfileId", request.getBarberProfileId())
                .get().get();

            boolean isOnLeave = false;
            for (var leaveDoc : leaveSnap.getDocuments()) {
                String status = leaveDoc.getString("status");
                String leaveDate = leaveDoc.getString("requestedDate");
                if ("APPROVED".equals(status) && appointmentDateStr.equals(leaveDate)) {
                    isOnLeave = true;
                    break;
                }
            }

            if (isOnLeave) {
                throw new RuntimeException(
                    "This barber is on approved leave on " + appointmentDateStr +
                    ". Please choose a different date."
                );
            }

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

            java.util.List<Appointment> appointments = querySnapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Appointment.class))
                    .collect(java.util.stream.Collectors.toList());
            appointments.forEach(appt -> enrichAppointmentDisplayFields(db, appt));
            return appointments;
                    
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to fetch appointments from Firestore", e);
            throw new RuntimeException("Failed to fetch appointments", e);
        }
    }

    public java.util.List<Appointment> getAppointmentsByBarberProfileId(String barberProfileId) {
        log.info("Fetching appointments for Barber ID: {}", barberProfileId);
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            com.google.cloud.firestore.QuerySnapshot querySnapshot = db.collection("appointments")
                    .whereEqualTo("barber_profile_id", barberProfileId)
                    .get()
                    .get();

            java.util.List<Appointment> appointments = querySnapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Appointment.class))
                    .collect(java.util.stream.Collectors.toList());
            appointments.forEach(appt -> enrichAppointmentDisplayFields(db, appt));
                    
            appointments.sort((a, b) -> {
                if (a.getAppointmentDateTime() == null && b.getAppointmentDateTime() == null) return 0;
                if (a.getAppointmentDateTime() == null) return 1;
                if (b.getAppointmentDateTime() == null) return -1;
                return b.getAppointmentDateTime().compareTo(a.getAppointmentDateTime());
            });
            
            return appointments;
                    
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to fetch appointments for barber from Firestore", e);
            throw new RuntimeException("Failed to fetch appointments for barber", e);
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

            // 3. Generate or update one Income Record for this appointment
            var existingIncome = db.collection("income_records")
                    .whereEqualTo("appointment_id", appointmentId)
                    .limit(1)
                    .get()
                    .get();
            String incomeRecordId = existingIncome.isEmpty()
                    ? UUID.randomUUID().toString()
                    : existingIncome.getDocuments().get(0).getId();

            IncomeRecord incomeRecord = new IncomeRecord();
            incomeRecord.setIncome_record_id(incomeRecordId);
            incomeRecord.setBarber_profile_id(appointment.getBarber_profile_id());
            incomeRecord.setAppointment_id(appointment.getAppointment_id() != null ? appointment.getAppointment_id() : appointmentId);
            incomeRecord.setCustomerId(appointment.getCustomer_id());
            incomeRecord.setCustomerFullName(resolveCustomerFullName(db, appointment.getCustomer_id()));
            incomeRecord.setBarberFullName(resolveBarberFullName(db, appointment.getBarber_profile_id()));
            incomeRecord.setServiceName(resolveServiceName(db, appointment.getHaircut_style_id()));
            incomeRecord.setAmount(total);
            incomeRecord.setPlatformFee(platformFee);
            incomeRecord.setNetAmount(netAmount);
            
            // Map payment method safely
            try {
                incomeRecord.setPaymentMethod(IncomeRecord.PaymentMethod.valueOf(appointment.getPaymentMethod().name()));
            } catch (Exception e) {
                incomeRecord.setPaymentMethod(IncomeRecord.PaymentMethod.CASH);
            }
            
            incomeRecord.setPaymentStatus(Appointment.PaymentStatus.PAID.name());
            incomeRecord.setRecordedAt(LocalDateTime.now().toString());

            // 4. Update Appointment Status
            appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
            appointment.setPaymentStatus(Appointment.PaymentStatus.PAID);
            appointment.setUpdatedAt(new Date());

            // 5. Commit to Firestore atomically using WriteBatch
            com.google.cloud.firestore.WriteBatch batch = db.batch();
            batch.set(
                db.collection("income_records")
                  .document(Objects.requireNonNull(incomeRecord.getIncome_record_id())),
                incomeRecord
            );
            batch.set(
                db.collection("appointments")
                  .document(Objects.requireNonNull(appointmentId)),
                appointment
            );
            batch.commit().get();

            String notificationMessage = "Appointment completed! " + netAmount + " added to your earnings.";
            eventManager.notifyAll(appointment.getBarber_profile_id(), notificationMessage);

            return appointment;

        } catch (Exception e) {
            log.error("Failed to process appointment completion", e);
            throw new RuntimeException("Failed to complete appointment and process income", e);
        }
    }

    private String resolveCustomerFullName(Firestore db, String customerId) {
        if (customerId == null || customerId.isBlank()) return "Customer";
        try {
            DocumentSnapshot customer = db.collection("users").document(customerId).get().get();
            return resolvePersonName(customer, "Customer");
        } catch (Exception e) {
            log.warn("Could not resolve customer name for {}: {}", customerId, e.getMessage());
            return "Customer";
        }
    }

    private void enrichAppointmentDisplayFields(Firestore db, Appointment appointment) {
        if (appointment == null) return;
        appointment.setCustomerFullName(resolveCustomerFullName(db, appointment.getCustomer_id()));
        appointment.setBarberFullName(resolveBarberFullName(db, appointment.getBarber_profile_id()));
        appointment.setServiceName(resolveServiceName(db, appointment.getHaircut_style_id()));
        appointment.setCustomerProfileImageUrl(resolveUserProfileImage(db, appointment.getCustomer_id()));
        appointment.setBarberProfileImageUrl(resolveBarberProfileImage(db, appointment.getBarber_profile_id()));
    }

    private String resolveUserProfileImage(Firestore db, String userId) {
        if (userId == null || userId.isBlank()) return null;
        try {
            DocumentSnapshot user = db.collection("users").document(userId).get().get();
            return user.exists() ? firstNonBlank(user.getString("profileImageUrl"), user.getString("photoUrl"), user.getString("avatarUrl")) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String resolveBarberProfileImage(Firestore db, String barberProfileId) {
        if (barberProfileId == null || barberProfileId.isBlank()) return null;
        try {
            DocumentSnapshot profile = db.collection("barber_profiles").document(barberProfileId).get().get();
            if (!profile.exists()) {
                var profileQuery = db.collection("barber_profiles")
                        .whereEqualTo("barber_profile_id", barberProfileId)
                        .limit(1)
                        .get()
                        .get();
                if (!profileQuery.isEmpty()) profile = profileQuery.getDocuments().get(0);
            }
            String profileImage = profile.exists() ? firstNonBlank(profile.getString("profileImageUrl"), profile.getString("photoUrl"), profile.getString("avatarUrl")) : null;
            if (profileImage != null && !profileImage.isBlank()) return profileImage;
            String userId = profile.exists() ? profile.getString("user_id") : null;
            return resolveUserProfileImage(db, userId);
        } catch (Exception e) {
            return null;
        }
    }

    private String resolveBarberFullName(Firestore db, String barberProfileId) {
        if (barberProfileId == null || barberProfileId.isBlank()) return "Barber";
        try {
            DocumentSnapshot profile = db.collection("barber_profiles").document(barberProfileId).get().get();
            if (!profile.exists()) {
                var profileQuery = db.collection("barber_profiles")
                        .whereEqualTo("barber_profile_id", barberProfileId)
                        .limit(1)
                        .get()
                        .get();
                if (!profileQuery.isEmpty()) {
                    profile = profileQuery.getDocuments().get(0);
                }
            }

            String userId = profile.exists() ? profile.getString("user_id") : null;
            if (userId != null && !userId.isBlank()) {
                DocumentSnapshot barberUser = db.collection("users").document(userId).get().get();
                String userName = resolvePersonName(barberUser, "");
                if (!userName.isBlank()) return userName;
            }

            if (profile.exists()) {
                String profileName = firstNonBlank(
                        profile.getString("name"),
                        profile.getString("shopName"),
                        profile.getString("displayName"),
                        profile.getString("username"),
                        profile.getString("email")
                );
                if (!profileName.isBlank()) return profileName;
            }
        } catch (Exception e) {
            log.warn("Could not resolve barber name for {}: {}", barberProfileId, e.getMessage());
        }
        return "Barber";
    }

    private String resolveServiceName(Firestore db, String haircutStyleId) {
        if (haircutStyleId == null || haircutStyleId.isBlank()) return "Haircut Service";
        try {
            DocumentSnapshot style = db.collection("haircut_styles").document(haircutStyleId).get().get();
            if (!style.exists()) {
                var styleQuery = db.collection("haircut_styles")
                        .whereEqualTo("haircut_style_id", haircutStyleId)
                        .limit(1)
                        .get()
                        .get();
                if (!styleQuery.isEmpty()) {
                    style = styleQuery.getDocuments().get(0);
                }
            }
            if (style.exists()) {
                String name = firstNonBlank(style.getString("name"), style.getString("serviceName"));
                if (!name.isBlank()) return name;
            }
        } catch (Exception e) {
            log.warn("Could not resolve service name for {}: {}", haircutStyleId, e.getMessage());
        }
        return "Haircut Service";
    }

    private String resolvePersonName(DocumentSnapshot userDoc, String fallback) {
        if (userDoc == null || !userDoc.exists()) return fallback;
        String firstName = userDoc.getString("firstName");
        String lastName = userDoc.getString("lastName");
        String fullName = ((firstName == null ? "" : firstName.trim()) + " " +
                (lastName == null ? "" : lastName.trim())).trim();
        if (!fullName.isBlank()) return fullName;
        return firstNonBlank(
                userDoc.getString("username"),
                userDoc.getString("displayName"),
                userDoc.getString("email"),
                fallback
        );
    }

    private String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String value : values) {
            if (value != null && !value.trim().isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    public Appointment updateAppointmentStatus(String appointmentId, String status) {
        log.info("Updating appointment status: {} to {}", appointmentId, status);
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            com.google.cloud.firestore.DocumentReference docRef = db.collection("appointments").document(java.util.Objects.requireNonNull(appointmentId));
            com.google.cloud.firestore.DocumentSnapshot doc = docRef.get().get();
            if (!doc.exists()) {
                throw new RuntimeException("Appointment not found");
            }

            docRef.update("status", status).get();

            Appointment updated = doc.toObject(Appointment.class);
            if (updated != null) {
                updated.setStatus(Appointment.AppointmentStatus.valueOf(status));
            }
            return updated;

        } catch (Exception e) {
            log.error("Failed to update appointment status", e);
            throw new RuntimeException("DB Error", e);
        }
    }
}
