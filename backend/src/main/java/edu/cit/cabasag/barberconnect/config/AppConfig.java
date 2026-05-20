package edu.cit.cabasag.barberconnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * General application bean configuration.
 */
@Configuration
public class AppConfig {

    /**
     * Shared RestTemplate used by AuthService for Firebase Auth REST API calls.
     * Declared as a bean so it can be injected and mocked in unit tests.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
