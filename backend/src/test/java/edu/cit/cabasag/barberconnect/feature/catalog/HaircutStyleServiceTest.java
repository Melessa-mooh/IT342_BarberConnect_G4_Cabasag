package edu.cit.cabasag.barberconnect.feature.catalog;


import edu.cit.cabasag.barberconnect.service.HaircutStyleService;
import edu.cit.cabasag.barberconnect.service.FirebaseService;
import edu.cit.cabasag.barberconnect.service.CloudinaryService;
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
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests — Catalog Feature Slice
 * TC-CAT-01 through TC-CAT-03
 *
 * Uses CompletableFuture-backed doReturn() stubs to avoid raw ApiFuture generic issues.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Catalog Feature — HaircutStyleService Tests")
class HaircutStyleServiceTest {

    @Mock private FirebaseService firebaseService;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private Firestore mockDb;
    @Mock private CollectionReference collectionRef;
    @Mock private DocumentReference docRef;
    @Mock private WriteResult writeResult;
    @Mock private Query query;
    @Mock private QuerySnapshot querySnapshot;

    @InjectMocks
    private HaircutStyleService haircutStyleService;

    @SuppressWarnings("null")
    @BeforeEach
    void setUp() throws Exception {
        when(firebaseService.getFirestore()).thenReturn(mockDb);
        when(mockDb.collection("haircut_styles")).thenReturn(collectionRef);
        when(collectionRef.document(anyString())).thenReturn(docRef);

        // Avoid raw ApiFuture: use CompletableFuture-backed doReturn
        var writeFuture = CompletableFuture.completedFuture(writeResult);
        doReturn(writeFuture).when(docRef).set(any());
    }

    @Test
    @DisplayName("TC-CAT-01: createHaircutStyle() returns a style with isActive=true")
    void createHaircutStyle_returnsActiveStyle() throws Exception {
        // Act
        HaircutStyle result = haircutStyleService.createHaircutStyle(
                "barber-001", "Fade", "Clean fade cut",
                new BigDecimal("250.00"), 30, null);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Fade");
        assertThat(result.getBarber_profile_id()).isEqualTo("barber-001");
        assertThat(result.getIsActive()).isTrue();
        assertThat(result.getBasePrice()).isEqualByComparingTo("250.00");
    }

    @Test
    @DisplayName("TC-CAT-02: createHaircutStyle() assigns a non-null UUID as ID")
    void createHaircutStyle_assignsUniqueId() throws Exception {
        // Act
        HaircutStyle result = haircutStyleService.createHaircutStyle(
                "barber-001", "Pompadour", "Classic pompadour",
                new BigDecimal("300.00"), 45, null);

        // Assert
        assertThat(result.getHaircut_style_id()).isNotNull().isNotEmpty();
    }

    @Test
    @SuppressWarnings("null")
    @DisplayName("TC-CAT-03: getHaircutStylesForBarber() returns empty list when none exist")
    void getHaircutStylesForBarber_noStyles_returnsEmptyList() throws Exception {
        // Arrange
        when(collectionRef.whereEqualTo(anyString(), any())).thenReturn(query);
        when(query.whereEqualTo(anyString(), any())).thenReturn(query);

        var queryFuture = CompletableFuture.completedFuture(querySnapshot);
        doReturn(queryFuture).when(query).get();
        when(querySnapshot.getDocuments()).thenReturn(List.of());

        // Act
        List<HaircutStyle> result = haircutStyleService.getHaircutStylesForBarber("unknown-barber");

        // Assert
        assertThat(result).isNotNull().isEmpty();
    }
}
