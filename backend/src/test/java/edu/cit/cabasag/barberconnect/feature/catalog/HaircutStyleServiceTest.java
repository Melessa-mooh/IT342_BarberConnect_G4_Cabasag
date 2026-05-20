package edu.cit.cabasag.barberconnect.feature.catalog;

import edu.cit.cabasag.barberconnect.service.HaircutStyleService;
import edu.cit.cabasag.barberconnect.service.FirebaseService;
import edu.cit.cabasag.barberconnect.service.CloudinaryService;
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
 * Unit Tests — Catalog Feature Slice
 * TC-CAT-01 through TC-CAT-03
 *
 * Uses ApiFuture mocks (not CompletableFuture) to match Firestore's return type.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Catalog Feature — HaircutStyleService Tests")
class HaircutStyleServiceTest {

    @Mock private FirebaseService    firebaseService;
    @Mock private CloudinaryService  cloudinaryService;
    @Mock private Firestore          mockDb;

    // ── haircut_styles collection mocks ───────────────────────────────────────
    @Mock private CollectionReference            collectionRef;
    @Mock private DocumentReference              docRef;
    @Mock private ApiFuture<WriteResult>         writeFuture;

    // ── query mocks ───────────────────────────────────────────────────────────
    @Mock private Query                          query;
    @Mock private ApiFuture<QuerySnapshot>       queryFuture;
    @Mock private QuerySnapshot                  querySnapshot;

    @InjectMocks private HaircutStyleService haircutStyleService;

    @BeforeEach
    void setUp() throws Exception {
        when(firebaseService.getFirestore()).thenReturn(mockDb);
        when(mockDb.collection("haircut_styles")).thenReturn(collectionRef);
        when(collectionRef.document(anyString())).thenReturn(docRef);
        // Use doReturn to avoid ambiguity with overloaded set() methods
        doReturn(writeFuture).when(docRef).set(any(Object.class));
        lenient().when(writeFuture.get()).thenReturn(null);
    }

    // ── TC-CAT-01 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-CAT-01: createHaircutStyle() returns a style with isActive=true")
    void createHaircutStyle_returnsActiveStyle() {
        HaircutStyle result = haircutStyleService.createHaircutStyle(
                "barber-001", "Fade", "Clean fade cut",
                new BigDecimal("250.00"), 30, null);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Fade");
        assertThat(result.getBarber_profile_id()).isEqualTo("barber-001");
        assertThat(result.getIsActive()).isTrue();
        assertThat(result.getBasePrice()).isEqualByComparingTo("250.00");
    }

    // ── TC-CAT-02 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-CAT-02: createHaircutStyle() assigns a non-null UUID as ID")
    void createHaircutStyle_assignsUniqueId() {
        HaircutStyle result = haircutStyleService.createHaircutStyle(
                "barber-001", "Pompadour", "Classic pompadour",
                new BigDecimal("300.00"), 45, null);

        assertThat(result.getHaircut_style_id()).isNotNull().isNotEmpty();
    }

    // ── TC-CAT-03 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-CAT-03: getHaircutStylesForBarber() returns seeded defaults when none exist")
    void getHaircutStylesForBarber_noStyles_seedsDefaults() throws Exception {
        // Arrange — query returns empty, triggering seedDefaultStyles()
        when(collectionRef.whereEqualTo(anyString(), any())).thenReturn(query);
        when(query.get()).thenReturn(queryFuture);
        when(queryFuture.get()).thenReturn(querySnapshot);
        when(querySnapshot.getDocuments()).thenReturn(List.of());

        // Act
        List<HaircutStyle> result = haircutStyleService.getHaircutStylesForBarber("unknown-barber");

        // Assert — seedDefaultStyles() creates 4 default styles
        assertThat(result).isNotNull().hasSize(4);
        assertThat(result).extracting(HaircutStyle::getName)
                .containsExactlyInAnyOrder("Classic Cut", "Barber Cut", "Trend Cut", "Premium Cut");
    }
}
