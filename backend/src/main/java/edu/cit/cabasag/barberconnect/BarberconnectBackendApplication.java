package edu.cit.cabasag.barberconnect;

import edu.cit.cabasag.barberconnect.model.User;
import edu.cit.cabasag.barberconnect.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Optional;

@SpringBootApplication
public class BarberconnectBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BarberconnectBackendApplication.class, args);
	}

	@Bean
	CommandLineRunner initAdmin(UserService userService) {
		return args -> {
			Optional<User> userOpt = userService.findByEmail("mamelessacabasag@gmail.com");
			userOpt.ifPresent(user -> {
				if (user.getRole() != User.UserRole.ADMIN) {
					user.setRole(User.UserRole.ADMIN);
					userService.save(user);
					System.out.println("=====> USER ELEVATED TO ADMIN: mamelessacabasag@gmail.com <=====");
				}
			});
		};
	}
}
