package edu.cit.cabasag.barberconnect.feature.appointment;

import edu.cit.cabasag.barberconnect.service.AppointmentService;
import edu.cit.cabasag.barberconnect.service.FirebaseService;
import edu.cit.cabasag.barberconnect.observer.AppointmentEventManager;
import edu.cit.cabasag.barberconnect.dto.request.CreateAppointmentRequest;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests — Appointment Feature Slice
 * TC-APT-01 through TC-APT-04
 *
 * bookAppointment() queries both "appointments" and "leave_requests" collections.
 * Both are fully mocked here so no real Firestore connection is needed.
 * ApiFuture mocks are used (not CompletableFuture) to match Firestore's return type.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Appointment Feature — AppointmentService Tests")
class AppointmentServiceTest {

    @Mock private FirebaseService         firebaseService;
    @Mock private AppointmentEventManager eventManager;
    @Mock private Firestore               mockDb;

    // ── appointments collection mocks ─────────────────────────────────────────
    @Mock private CollectionReference     appointmentsRef;
    @Mock private DocumentReference       apptDocRef;
    @Mock private ApiFuture<WriteResult>  writeResultFuture;
    @Mock private WriteResult             writeResult;

    // ── leave_requests collection mocks ──────────────────────────────────────
    @Mock private CollectionReference          leaveRef;
    @Mock private Query                        leaveQuery;
    @Mock private ApiFuture<QuerySnapshot>     leaveQueryFuture;
    @Mock private QuerySnapshot                leaveSnapshot;

    @InjectMocks private AppointmentService appointmentService;

    /**
     * Shared setup: Firestore available + leave_requests returns empty (no leave).
     * The appointments write stub is NOT set here — only tests that reach the
     * write step set it themselves, avoiding UnnecessaryStubbing in TC-APT-04.
     */
    @BeforeEach
    void setUp() throws Exception {
        when(firebaseService.getFirestore()).thenReturn(mockDb);

        // leave_requests — default: no approved leave
        when(mockDb.collection("leave_requests")).thenReturn(leaveRef);
        when(leaveRef.whereEqualTo(anyString(), any())).thenReturn(leaveQuery);
        when(leaveQuery.get()).thenReturn(leaveQueryFuture);
        when(leaveQueryFuture.get()).thenReturn(leaveSnapshot);
        when(leaveSnapshot.getDocuments()).thenReturn(List.of());
    }

    /** Configures the appointments write path for tests that reach db.set(). */
    private void stubAppointmentWrite() throws Exception {
        when(mockDb.collection("appointments")).thenReturn(appointmentsRef);
        when(appointmentsRef.document(anyString())).thenReturn(apptDocRef);
        doReturn(writeResultFuture).when(apptDocRef).set(any(Object.class));
        when(writeResultFuture.get()).thenReturn(writeResult);
    }

    // ── TC-APT-01 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-APT-01: bookAppointment() returns an Appointment with PENDING status")
    void bookAppointment_validRequest_returnsPendingAppointment() throws Exception {
        stubAppointmentWrite();
        CreateAppointmentRequest request = buildRequest("customer-001", "barber-001", "style-001",
                "2025-06-15T10:00:00Z", new BigDecimal("350.00"), "CASH");

        Appointment result = appointmentService.bookAppointment(request);

        assertThat(result).isNotNull();
        assertThat(result.getCustomer_id()).isEqualTo("customer-001");
        assertThat(result.getBarber_profile_id()).isEqualTo("barber-001");
        assertThat(result.getStatus()).isEqualTo(Appointment.AppointmentStatus.PENDING);
        assertThat(result.getTotalPrice()).isEqualByComparingTo("350.00");
    }

    // ── TC-APT-02 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-APT-02: bookAppointment() generates a unique appointment_id for each call")
    void bookAppointment_generatesUniqueId() throws Exception {
        stubAppointmentWrite();
        CreateAppointmentRequest request = buildRequest("c1", "b1", "s1",
                "2025-06-15T10:00:00Z", BigDecimal.valueOf(200), "CASH");

        Appointment r1 = appointmentService.bookAppointment(request);
        Appointment r2 = appointmentService.bookAppointment(request);

        assertThat(r1.getAppointment_id()).isNotEqualTo(r2.getAppointment_id());
    }

    // ── TC-APT-03 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-APT-03: bookAppointment() notifies the event manager after booking")
    void bookAppointment_notifiesEventManager() throws Exception {
        stubAppointmentWrite();
        CreateAppointmentRequest request = buildRequest("cust-notify", "barb-001", "style-001",
                "2025-06-15T10:00:00Z", BigDecimal.valueOf(300), "CASH");

        appointmentService.bookAppointment(request);

        verify(eventManager).notifyAll(eq("cust-notify"), anyString());
    }

    // ── TC-APT-04 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-APT-04: bookAppointment() throws when barber is on approved leave")
    void bookAppointment_barberOnLeave_throwsException() throws Exception {
        // Override the default empty-leave stub: return one approved leave doc
        QueryDocumentSnapshot leaveDoc = mock(QueryDocumentSnapshot.class);
        when(leaveDoc.getString("status")).thenReturn("APPROVED");
        // Appointment is on 2025-06-15 (Asia/Manila)
        when(leaveDoc.getString("requestedDate")).thenReturn("2025-06-15");
        when(leaveSnapshot.getDocuments()).thenReturn(List.of(leaveDoc));

        // No appointments write stub needed — exception is thrown before the write
        CreateAppointmentRequest request = buildRequest("c1", "b1", "s1",
                "2025-06-15T01:00:00Z", BigDecimal.valueOf(300), "CASH");

        assertThatThrownBy(() -> appointmentService.bookAppointment(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("approved leave");
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private CreateAppointmentRequest buildRequest(String customerId, String barberId,
            String styleId, String dateTime, BigDecimal price, String payment) {
        CreateAppointmentRequest r = new CreateAppointmentRequest();
        r.setCustomerId(customerId);
        r.setBarberProfileId(barberId);
        r.setHaircutStyleId(styleId);
        r.setAppointmentDateTime(dateTime);
        r.setTotalPrice(price);
        r.setPaymentMethod(payment);
        return r;
    }
}
