package com.example.URLShortenerService.controller;

import com.example.URLShortenerService.entity.ShortUrl;
import com.example.URLShortenerService.service.ShortUrlService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ShortUrlController {

    private final ShortUrlService service;

    @PostMapping("/shorten")
    public ResponseEntity<ShortUrl> shorten(@RequestParam String url) {
        if (url == null || url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL must not be empty");
        }
        log.info("Received shorten request for URL: {}", url.replaceAll("[\r\n]", "_"));
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createShortUrl(url));
    }

    @GetMapping("/{shortCode}")
    public void redirect(@PathVariable String shortCode, HttpServletResponse response) throws IOException {
        log.info("Received redirect request for shortCode: {}", shortCode.replaceAll("[\r\n]", "_"));
        response.sendRedirect(service.getOriginalUrl(shortCode));
    }
}
