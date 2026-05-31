package com.example.URLShortenerService.controller;

import com.example.URLShortenerService.entity.User;
import com.example.URLShortenerService.model.ShortenUrlRequest;
import com.example.URLShortenerService.model.ShortenUrlResponse;
import com.example.URLShortenerService.service.ShortUrlService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ShortUrlController {

    private final ShortUrlService service;

    @PostMapping("/shorten")
    public ResponseEntity<ShortenUrlResponse> shorten(
            @Valid @RequestBody ShortenUrlRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest) {

        log.info("Shorten request for: {}, User: {}", 
                request.getUrl().replaceAll("[\\r\\n]", "_"), 
                user != null ? user.getEmail() : "Anonymous");

        // Recompute the base URL based on the incoming request context
        String baseUrl = httpRequest.getScheme() + "://"
                + httpRequest.getServerName() + ":" + httpRequest.getServerPort();

        ShortenUrlResponse response = service.createShortUrlResponse(
                request.getUrl(), 
                request.getExpiredAt(), 
                user, 
                baseUrl
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/urls")
    public ResponseEntity<List<ShortenUrlResponse>> getUserUrls(
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String baseUrl = httpRequest.getScheme() + "://"
                + httpRequest.getServerName() + ":" + httpRequest.getServerPort();

        return ResponseEntity.ok(service.getUserUrls(user, baseUrl));
    }

    @PostMapping("/urls/migrate")
    public ResponseEntity<?> migrateUrls(
            @RequestBody List<String> shortCodes,
            @AuthenticationPrincipal User user) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        service.migrateGuestUrls(shortCodes, user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/urls/{shortCode}")
    public ResponseEntity<?> deleteUrl(
            @PathVariable String shortCode,
            @AuthenticationPrincipal User user) {

        service.deleteShortUrl(shortCode, user);
        return ResponseEntity.ok().build();
    }
}
