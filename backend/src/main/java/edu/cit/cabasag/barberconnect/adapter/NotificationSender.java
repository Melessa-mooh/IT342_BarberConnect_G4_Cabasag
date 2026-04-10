package edu.cit.cabasag.barberconnect.adapter;

/**
 * Structural Design Pattern: Adapter
 * This is the Target interface that our domain expects to use.
 */
public interface NotificationSender {
    void sendNotification(String userId, String message);
}
