package edu.cit.cabasag.barberconnect.feature.appointment;

import edu.cit.cabasag.barberconnect.feature.shared.FirebaseService;
import edu.cit.cabasag.barberconnect.feature.appointment.Appointment;
import edu.cit.cabasag.barberconnect.observer.AppointmentEventManager;
import edu.cit.cabasag.barberconnect.dto.request.CreateAppointmentRequest;
import com.google.cloud.firestore.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests — Appointment Feature Slice
 * TC-APT-01 through TC-APT-03
 *
 * Note: Firestore ApiFuture is avoided in mocks by using doReturn() with
 * CompletableFuture-backed stubs. The real Firestore calls are fully mocked
 * at the CollectionReference + DocumentReference level.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Appointment Feature — AppointmentService Tests")
class AppointmentServiceTest {

    @Mock private FirebaseService firebaseService;
    @Mock private AppointmentEventManager eventManager;
    @Mock private Firestore mockDb;
    @Mock private CollectionReference appointmentsRef;
    @Mock private DocumentReference docRef;
    @Mock private WriteResult writeResult;

    @InjectMocks private AppointmentService appointmentService;

    @SuppressWarnings("null")
    @BeforeEach
    void setUp() throws Exception {
        when(firebaseService.getFirestore()).thenReturn(mockDb);
        when(mockDb.collection("appointments")).thenReturn(appointmentsRef);
        when(appointmentsRef.document(anyString())).thenReturn(docRef);

        // Use a real CompletableFuture-based Future to avoid raw ApiFuture generics
        var future = CompletableFuture.completedFuture(writeResult);
        doReturn(future).when(docRef).set(any());
    }

    @Test
    @DisplayName("TC-APT-01: bookAppointment() returns an Appointment with PENDING status")
    void bookAppointment_validRequest_returnsPendingAppointment() throws Exception {
        // Arrange
        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setCustomerId("customer-001");
        request.setBarberProfileId("barber-001");
        request.setHaircutStyleId("style-001");
        request.setAppointmentDateTime("2025-06-15T10:00:00Z");
        request.setTotalPrice(new BigDecimal("350.00"));
        request.setPaymentMethod("CASH");

        // Act
        Appointment result = appointmentService.bookAppointment(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getCustomer_id()).isEqualTo("customer-001");
        assertThat(result.getBarber_profile_id()).isEqualTo("barber-001");
        assertThat(result.getStatus()).isEqualTo(Appointment.AppointmentStatus.PENDING);
        assertThat(result.getTotalPrice()).isEqualByComparingTo("350.00");
    }

    @Test
    @DisplayName("TC-APT-02: bookAppointment() generates a unique appointment_id")
    void bookAppointment_generatesUniqueId() throws Exception {
        // Arrange
        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setCustomerId("c1");
        request.setBarberProfileId("b1");
        request.setHaircutStyleId("s1");
        request.setAppointmentDateTime("2025-06-15T10:00:00Z");
        request.setTotalPrice(BigDecimal.valueOf(200));
        request.setPaymentMethod("CASH");

        // Act
        Appointment r1 = appointmentService.bookAppointment(request);
        Appointment r2 = appointmentService.bookAppointment(request);

        // Assert
        assertThat(r1.getAppointment_id()).isNotEqualTo(r2.getAppointment_id());
    }

    @Test
    @DisplayName("TC-APT-03: bookAppointment() notifies the event manager after booking")
    void bookAppointment_notifiesEventManager() throws Exception {
        // Arrange
        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setCustomerId("cust-notify");
        request.setBarberProfileId("barb-001");
        request.setHaircutStyleId("style-001");
        request.setAppointmentDateTime("2025-06-15T10:00:00Z");
        request.setTotalPrice(BigDecimal.valueOf(300));
        request.setPaymentMethod("CASH");

        // Act
        appointmentService.bookAppointment(request);

        // Assert
        verify(eventManager).notifyAll(eq("cust-notify"), anyString());
    }
}
