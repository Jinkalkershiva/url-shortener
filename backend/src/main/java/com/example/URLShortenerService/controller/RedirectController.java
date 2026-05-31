package com.example.URLShortenerService.controller;

import com.example.URLShortenerService.service.ShortUrlService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Slf4j
@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final ShortUrlService service;

    @GetMapping("/r/{shortCode}")
    public void redirect(@PathVariable String shortCode,
                         HttpServletResponse response) throws IOException {

        log.info("Redirect request for shortCode: {}", shortCode.replaceAll("[\\r\\n]", "_"));
        try {
            String originalUrl = service.getOriginalUrl(shortCode);
            response.sendRedirect(originalUrl);
        } catch (ResponseStatusException ex) {
            // Both GONE (expired) and NOT_FOUND (deleted / invalid) redirect to the premium expired warning screen!
            response.sendRedirect("/expired?code=" + shortCode);
        }
    }
}
