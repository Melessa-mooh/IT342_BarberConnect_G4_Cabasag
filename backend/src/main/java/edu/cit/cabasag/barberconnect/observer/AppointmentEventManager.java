package edu.cit.cabasag.barberconnect.observer;

import edu.cit.cabasag.barberconnect.adapter.NotificationSender;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Behavioral Design Pattern: Observer
 * This acts as the Event Manager (Subject). It maintains a list of observers
 * (NotificationSenders) and notifies them automatically without tight coupling.
 */
@Component
public class AppointmentEventManager {

    private final List<NotificationSender> listeners = new ArrayList<>();

    // In Spring, we could autowire the list of NotificationSender beans natively
    // But we are explicitly wiring this to demonstrate the bare-metal Observer pattern mechanics
    public AppointmentEventManager(List<NotificationSender> injectedListeners) {
        if (injectedListeners != null) {
            this.listeners.addAll(injectedListeners);
        }
    }

    public void subscribe(NotificationSender listener) {
        listeners.add(listener);
    }

    public void unsubscribe(NotificationSender listener) {
        listeners.remove(listener);
    }

    public void notifyAll(String userId, String message) {
        for (NotificationSender listener : listeners) {
            listener.sendNotification(userId, message);
        }
    }
}
