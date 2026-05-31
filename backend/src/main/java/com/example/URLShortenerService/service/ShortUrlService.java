package com.example.URLShortenerService.service;

import com.example.URLShortenerService.entity.ShortUrl;
import com.example.URLShortenerService.entity.User;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShortUrlService {

    private static final int MAX_ATTEMPTS = 5;

    private final ShortUrlRepository repository;
    private final ShortCodeGenerator shortCodeGenerator;

    @Transactional
    public ShortUrl createShortUrl(String originalUrl, LocalDateTime expiredAt, User user) {
        // Enforce the 7-day expiration limit check
        if (expiredAt != null) {
            LocalDateTime now = LocalDateTime.now();
            if (expiredAt.isBefore(now)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiration date cannot be in the past");
            }
            if (expiredAt.isAfter(now.plusDays(7))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiration date cannot be more than 7 days from now");
            }
        }

        // Reuse clean public links with no owner and no expiration
        if (expiredAt == null && user == null) {
            Optional<ShortUrl> existing = repository.findByOriginalUrl(originalUrl);
            Optional<ShortUrl> cleanExisting = existing.filter(u -> u.getUser() == null && u.getExpiredAt() == null);
            if (cleanExisting.isPresent()) {
                return cleanExisting.get();
            }
        }

        return saveWithUniqueCode(originalUrl, expiredAt, user);
    }

    @Transactional
    public String getOriginalUrl(String shortCode) {
        ShortUrl shortUrl = repository.findByShortCode(shortCode)
                .orElseThrow(() -> {
                    log.warn("Short code not found: {}", shortCode);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Short code not found: " + shortCode);
                });

        // Check if expired
        if (shortUrl.getExpiredAt() != null && LocalDateTime.now().isAfter(shortUrl.getExpiredAt())) {
            log.warn("Short code [{}] has expired at {}", shortCode, shortUrl.getExpiredAt());
            throw new ResponseStatusException(HttpStatus.GONE, "This short URL has expired");
        }

        // Increment click count
        shortUrl.setClickCount(shortUrl.getClickCount() + 1);
        repository.save(shortUrl);

        return shortUrl.getOriginalUrl();
    }

    public ShortenUrlResponse createShortUrlResponse(String originalUrl, LocalDateTime expiredAt, User user, String baseUrl) {
        ShortUrl shortUrl = createShortUrl(originalUrl, expiredAt, user);
        return mapToResponse(shortUrl, baseUrl);
    }

    @Transactional(readOnly = true)
    public List<ShortenUrlResponse> getUserUrls(User user, String baseUrl) {
        return repository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(url -> mapToResponse(url, baseUrl))
                .collect(Collectors.toList());
    }

    private ShortenUrlResponse mapToResponse(ShortUrl shortUrl, String baseUrl) {
        return ShortenUrlResponse.builder()
                .shortCode(shortUrl.getShortCode())
                .shortUrl(baseUrl + "/r/" + shortUrl.getShortCode())
                .originalUrl(shortUrl.getOriginalUrl())
                .createdAt(shortUrl.getCreatedAt())
                .expiredAt(shortUrl.getExpiredAt())
                .clickCount(shortUrl.getClickCount())
                .build();
    }

    @Transactional
    public void migrateGuestUrls(List<String> shortCodes, User user) {
        if (user == null || shortCodes == null || shortCodes.isEmpty()) {
            return;
        }
        for (String code : shortCodes) {
            repository.findByShortCode(code).ifPresent(url -> {
                if (url.getUser() == null) {
                    url.setUser(user);
                    repository.save(url);
                    log.info("Migrated guest short code [{}] to user [{}]", code, user.getEmail());
                }
            });
        }
    }

    private ShortUrl saveWithUniqueCode(String originalUrl, LocalDateTime expiredAt, User user) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                ShortUrl saved = repository.saveAndFlush(ShortUrl.builder()
                        .shortCode(shortCodeGenerator.generateShortCode())
                        .originalUrl(originalUrl)
                        .expiredAt(expiredAt)
                        .user(user)
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

    @Transactional
    public void deleteShortUrl(String shortCode, User user) {
        ShortUrl shortUrl = repository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short code not found: " + shortCode));

        // Enforce secure ownership checks
        if (shortUrl.getUser() != null) {
            if (user == null || !shortUrl.getUser().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete this link.");
            }
        }

        repository.delete(shortUrl);
        log.info("Successfully deleted short code [{}]", shortCode);
    }
}
