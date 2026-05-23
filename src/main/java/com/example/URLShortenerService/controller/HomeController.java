package com.example.URLShortenerService.controller;

import com.example.URLShortenerService.model.ShortenUrlRequest;
import com.example.URLShortenerService.model.ShortenUrlResponse;
import com.example.URLShortenerService.service.ShortUrlService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Controller
@RequiredArgsConstructor
public class HomeController {

    private final ShortUrlService service;

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("request", new ShortenUrlRequest());
        return "index";
    }

    @GetMapping("/shorten")
    public String shortenGet(Model model) {
        model.addAttribute("request", new ShortenUrlRequest());
        return "index";
    }

    @PostMapping("/shorten")
    public String shorten(
            @Valid @ModelAttribute("request") ShortenUrlRequest request,
            BindingResult bindingResult,
            HttpServletRequest httpRequest,
            Model model) {

        if (bindingResult.hasErrors()) {
            return "index";
        }

        log.info("Shorten request: {}", request.getUrl().replaceAll("[\\r\\n]", "_"));

        String baseUrl = httpRequest.getScheme() + "://"
                + httpRequest.getServerName() + ":" + httpRequest.getServerPort();

        ShortenUrlResponse response = service.createShortUrlResponse(request.getUrl(), baseUrl);
        model.addAttribute("response", response);
        return "result";
    }
}
