package com.barberconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BarberConnectApplication {

    public static void main(String[] args) {
        // Load local .env into system properties so Spring placeholders resolve
        Path envPath = Path.of(".env");
        if (Files.exists(envPath)) {
            try {
                for (String rawLine : Files.readAllLines(envPath)) {
                    String line = rawLine.trim();
                    if (line.isEmpty() || line.startsWith("#")) continue;
                    int idx = line.indexOf('=');
                    if (idx <= 0) continue;
                    String key = line.substring(0, idx).trim();
                    String value = line.substring(idx + 1).trim();
                    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length() - 1);
                    }
                    if (System.getProperty(key) == null && System.getenv(key) == null) {
                        System.setProperty(key, value);
                    }
                }
            } catch (IOException e) {
                // ignore and continue; environment variables may still provide values
            }
        }

        SpringApplication.run(BarberConnectApplication.class, args);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
