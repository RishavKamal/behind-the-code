package com.rishav.behindthecode.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rishav.behindthecode.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
}