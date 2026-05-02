package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest {

    private String leaveRequestId;
    private String barberProfileId;
    private String requestedDate;   // format: "yyyy-MM-dd"
    private String reason;
    private LeaveStatus status = LeaveStatus.PENDING;
    private Date createdAt;
    private Date resolvedAt;

    public enum LeaveStatus {
        PENDING, APPROVED, DECLINED
    }
}
