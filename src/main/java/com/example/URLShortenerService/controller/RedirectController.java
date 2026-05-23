package com.example.URLShortenerService.controller;

import com.example.URLShortenerService.service.ShortUrlService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@Slf4j
@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final ShortUrlService service;

    @GetMapping("/r/{shortCode}")
    public void redirect(@PathVariable String shortCode,
                         HttpServletResponse response) throws IOException {

        log.info("Redirect request: {}", shortCode.replaceAll("[\\r\\n]", "_"));
        response.sendRedirect(service.getOriginalUrl(shortCode));
    }
}
