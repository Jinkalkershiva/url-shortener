package com.example.URLShortenerService.service;

import com.example.URLShortenerService.entity.ShortUrl;
import com.example.URLShortenerService.model.ShortenUrlResponse;
import com.example.URLShortenerService.repository.ShortUrlRepository;
import com.example.URLShortenerService.util.ShortCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShortUrlService {

    private static final int MAX_ATTEMPTS = 5;

    private final ShortUrlRepository repository;
    private final ShortCodeGenerator shortCodeGenerator;

    @Transactional
    public ShortUrl createShortUrl(String originalUrl) {
        return repository.findByOriginalUrl(originalUrl)
                .orElseGet(() -> saveWithUniqueCode(originalUrl));
    }

    @Transactional(readOnly = true)
    public String getOriginalUrl(String shortCode) {
        return repository.findByShortCode(shortCode)
                .map(ShortUrl::getOriginalUrl)
                .orElseThrow(() -> {
                    log.warn("Short code not found: {}", shortCode);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Short code not found: " + shortCode);
                });
    }

    public ShortenUrlResponse createShortUrlResponse(String originalUrl, String baseUrl) {
        ShortUrl shortUrl = createShortUrl(originalUrl);
        return ShortenUrlResponse.builder()
                .shortCode(shortUrl.getShortCode())
                .shortUrl(baseUrl + "/" + shortUrl.getShortCode())
                .originalUrl(shortUrl.getOriginalUrl())
                .createdAt(shortUrl.getCreatedAt())
                .expiredAt(shortUrl.getExpiredAt())
                .build();
    }

    private ShortUrl saveWithUniqueCode(String originalUrl) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                ShortUrl saved = repository.saveAndFlush(ShortUrl.builder()
                        .shortCode(shortCodeGenerator.generateShortCode())
                        .originalUrl(originalUrl)
                        .build());
                log.info("Created short code [{}] for URL: {}", saved.getShortCode(), originalUrl);
                return saved;
            } catch (DataIntegrityViolationException e) {
                log.warn("Short code collision on attempt {}/{}. Retrying...", attempt, MAX_ATTEMPTS, e);
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to generate unique short code after " + MAX_ATTEMPTS + " attempts");
    }
}
