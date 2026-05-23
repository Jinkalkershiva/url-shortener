package com.example.URLShortenerService.controller;

import com.example.URLShortenerService.model.ShortenUrlRequest;
import com.example.URLShortenerService.model.ShortenUrlResponse;
import com.example.URLShortenerService.service.ShortUrlService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ShortUrlController {

    private final ShortUrlService service;

    @PostMapping("/shorten")
    public ResponseEntity<ShortenUrlResponse> shorten(
            @Valid @RequestBody ShortenUrlRequest request,
            HttpServletRequest httpRequest) {

        log.info("Shorten request: {}", request.getUrl().replaceAll("[\\r\\n]", "_"));

        String baseUrl = httpRequest.getScheme() + "://"
                + httpRequest.getServerName() + ":" + httpRequest.getServerPort();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createShortUrlResponse(request.getUrl(), baseUrl));
    }
}
