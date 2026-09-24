package com.rishav.behindthecode.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.rishav.behindthecode.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                // CSRF is disabled because this is a stateless JWT API.
                .csrf(csrf -> csrf.disable())

                // Enable Spring Security's CORS handling.
                .cors(Customizer.withDefaults())

                // JWT authentication is stateless.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Browser CORS preflight requests.
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // Public login endpoint.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/login"
                        ).permitAll()

                        // Public article reading.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/articles",
                                "/api/articles/**"
                        ).permitAll()

                        // Admin-only article creation.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/articles"
                        ).hasRole("ADMIN")

                        // Admin-only article editing.
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/articles/**"
                        ).hasRole("ADMIN")

                        // Admin-only article deletion.
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/articles/**"
                        ).hasRole("ADMIN")

                        // Public health check.
                        .requestMatchers(
                                "/api/health"
                        ).permitAll()

                        // Everything else requires authentication.
                        .anyRequest().authenticated()
                )

                // Run our JWT filter before Spring's username/password filter.
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}