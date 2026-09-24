package com.rishav.behindthecode.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.rishav.behindthecode.entity.User;
import com.rishav.behindthecode.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("ADMIN");

        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository
                .findByUsername(username)
                .orElse(null);
    }

    public boolean verifyPassword(
            String rawPassword,
            String encodedPassword
    ) {
        return passwordEncoder.matches(
                rawPassword,
                encodedPassword
        );
    }

    public User resetPassword(
            String username,
            String newPassword
    ) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(
                        () -> new RuntimeException(
                                "User not found"
                        )
                );

        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        return userRepository.save(user);
    }
}