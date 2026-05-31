package com.example.URLShortenerService.controller;

import com.example.URLShortenerService.entity.User;
import com.example.URLShortenerService.repository.UserRepository;
import com.example.URLShortenerService.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/mock-oauth2")
    public ResponseEntity<?> mockOAuth2(@RequestParam String provider) {
        String email = "mock." + provider + "@example.com";
        String name = "Mock " + provider.substring(0, 1).toUpperCase() + provider.substring(1) + " User";
        String avatarUrl = "google".equals(provider) 
                ? "https://lh3.googleusercontent.com/a/default-user=s96-c"
                : "https://avatars.githubusercontent.com/u/9919?v=4";
        
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .name(name)
                    .provider(provider)
                    .providerId("mock-id-" + provider)
                    .avatarUrl(avatarUrl)
                    .build();
            userRepository.save(user);
        }
        
        String token = jwtUtil.generateToken(user.getEmail(), user.getName());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", user
        ));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already registered."));
        }

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider("local")
                .providerId("local")
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "user", user
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getName());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", user
        ));
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class SignupRequest {
        @NotBlank(message = "Email must not be blank")
        @Email(message = "Must be a valid email format")
        private String email;

        @NotBlank(message = "Password must not be blank")
        @Size(min = 6, message = "Password must be at least 6 characters long")
        private String password;

        @NotBlank(message = "Name must not be blank")
        private String name;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Email must not be blank")
        @Email(message = "Must be a valid email format")
        private String email;

        @NotBlank(message = "Password must not be blank")
        private String password;
    }
}
