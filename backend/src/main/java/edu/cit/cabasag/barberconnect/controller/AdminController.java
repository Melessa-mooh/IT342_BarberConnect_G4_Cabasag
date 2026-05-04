package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.request.CreateBarberRequest;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.feature.admin.LeaveRequest;
import edu.cit.cabasag.barberconnect.feature.auth.User;
import edu.cit.cabasag.barberconnect.service.AdminService;
import edu.cit.cabasag.barberconnect.service.AdminService.AttendanceRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private final AdminService adminService;

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/admin/dashboard-stats
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(adminService.getShopStatistics());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/v1/admin/barbers/create
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/barbers/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> createBarber(@RequestBody CreateBarberRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().isBlank())
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
            if (request.getPassword() == null || request.getPassword().length() < 6)
                return ResponseEntity.badRequest().body(ApiResponse.error("Password must be at least 6 characters"));
            if (request.getFirstName() == null || request.getFirstName().isBlank())
                return ResponseEntity.badRequest().body(ApiResponse.error("First name is required"));

            User createdUser = adminService.createBarberAccount(request);
            log.info("Admin created barber account: {}", createdUser.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdUser));

        } catch (RuntimeException e) {
            log.error("Failed to create barber account: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/v1/admin/barbers/{userId}
    // ─────────────────────────────────────────────────────────────────────────

    @DeleteMapping("/barbers/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteBarber(@PathVariable String userId) {
        try {
            adminService.deactivateBarberAccount(userId);
            log.info("Admin deactivated barber account: userId={}", userId);
            return ResponseEntity.ok(ApiResponse.success("Barber account deactivated"));

        } catch (RuntimeException e) {
            log.error("Failed to deactivate barber '{}': {}", userId, e.getMessage());
            HttpStatus status = e.getMessage().contains("not found")
                    ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/admin/leave-requests   (all PENDING)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/leave-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getPendingLeaveRequests() {
        try {
            List<LeaveRequest> list = adminService.getPendingLeaveRequests();
            return ResponseEntity.ok(ApiResponse.success(list));
        } catch (RuntimeException e) {
            log.error("Failed to fetch pending leave requests: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/admin/leave-requests/{leaveRequestId}/approve
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/leave-requests/{leaveRequestId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LeaveRequest>> approveLeaveRequest(
            @PathVariable String leaveRequestId) {
        try {
            LeaveRequest updated = adminService.approveLeaveRequest(leaveRequestId);
            log.info("Leave request {} approved", leaveRequestId);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (RuntimeException e) {
            log.error("Failed to approve leave request {}: {}", leaveRequestId, e.getMessage());
            HttpStatus status = e.getMessage().contains("not found")
                    ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/admin/leave-requests/{leaveRequestId}/decline
    // ─────────────────────────────────────────────────────────────────────────

    @PutMapping("/leave-requests/{leaveRequestId}/decline")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LeaveRequest>> declineLeaveRequest(
            @PathVariable String leaveRequestId) {
        try {
            LeaveRequest updated = adminService.declineLeaveRequest(leaveRequestId);
            log.info("Leave request {} declined", leaveRequestId);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (RuntimeException e) {
            log.error("Failed to decline leave request {}: {}", leaveRequestId, e.getMessage());
            HttpStatus status = e.getMessage().contains("not found")
                    ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/admin/attendance/today
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/attendance/today")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getTodayAttendance() {
        try {
            List<AttendanceRecord> records = adminService.getTodayAttendance();
            return ResponseEntity.ok(ApiResponse.success(records));
        } catch (RuntimeException e) {
            log.error("Failed to get today's attendance: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/admin/income/barbers
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/income/barbers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminService.BarberIncomeSummary>>> getBarberIncomeSummaries() {
        try {
            List<AdminService.BarberIncomeSummary> summaries = adminService.getBarberIncomeSummaries();
            return ResponseEntity.ok(ApiResponse.success(summaries));
        } catch (RuntimeException e) {
            log.error("Failed to get barber income summaries: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
        }
    }
}
