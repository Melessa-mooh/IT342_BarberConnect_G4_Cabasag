package edu.cit.cabasag.barberconnect.factory;

import edu.cit.cabasag.barberconnect.model.User;
import edu.cit.cabasag.barberconnect.model.User.UserRole;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Creational Design Pattern: Factory Method
 * Encapsulates the complex creation logic of different types of users (Customer vs Barber).
 */
@Component
public class UserFactory {

    public User createUser(String firebaseUid, String firstName, String lastName, String email, String roleString) {
        User user = new User();
        user.setUser_id(firebaseUid);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPhoneNumber(""); // Empty by default
        user.setIsActive(true);
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());

        UserRole selectedRole = UserRole.CUSTOMER;
        if (roleString != null && roleString.equalsIgnoreCase("BARBER")) {
            selectedRole = UserRole.BARBER;
        }
        user.setRole(selectedRole);

        // Here we could attach specialized profiles based on role dynamically if needed
        // For example: if (selectedRole == UserRole.BARBER) { user.setBarberProfile(new BarberProfile()); }

        return user;
    }
}
