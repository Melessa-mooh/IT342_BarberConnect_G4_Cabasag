package edu.cit.cabasag.barberconnect.feature.admin;

import edu.cit.cabasag.barberconnect.feature.shared.FirebaseService;
import edu.cit.cabasag.barberconnect.service.AdminService;
import com.google.cloud.firestore.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests — Admin Feature Slice
 * TC-ADM-01 through TC-ADM-02
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Feature — AdminService Tests")
class AdminServiceTest {

    @Mock private edu.cit.cabasag.barberconnect.service.FirebaseService firebaseService;
    @Mock private com.google.firebase.auth.FirebaseAuth firebaseAuth;
    @Mock private edu.cit.cabasag.barberconnect.factory.UserFactory userFactory;
    @Mock private Firestore mockDb;
    @Mock private CollectionReference appointmentsRef;
    @Mock private AggregateQuery countQuery;
    @Mock private ApiFuture<AggregateQuerySnapshot> aggregateFuture;
    @Mock private AggregateQuerySnapshot aggregateSnapshot;

    @InjectMocks private AdminService adminService;

    @BeforeEach
    void setUp() throws Exception {
        when(firebaseService.getFirestore()).thenReturn(mockDb);
    }

    @Test
    @DisplayName("TC-ADM-01: getShopStatistics() returns non-null map with 4 keys")
    void getShopStatistics_returnsNonNullMap() {
        // Act
        Map<String, Object> stats = adminService.getShopStatistics();

        // Assert
        assertThat(stats).isNotNull();
        assertThat(stats).containsKeys(
                "totalAppointments", "activeBarbers", "totalCustomers", "totalRevenue");
    }

    @Test
    @DisplayName("TC-ADM-02: getShopStatistics() returns fallback 0 values on Firestore error")
    void getShopStatistics_firestoreError_returnsFallbackZeros() {
        // Arrange: simulate Firestore being unavailable
        when(firebaseService.getFirestore()).thenReturn(null);

        // Act
        Map<String, Object> stats = adminService.getShopStatistics();

        // Assert — should return defaults, not throw
        assertThat(stats).isNotNull();
        assertThat(stats.get("totalRevenue")).isEqualTo(0);
        assertThat(stats.get("totalAppointments")).isEqualTo(0);
    }
}
