package com.example.URLShortenerService.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping(value = { "/", "/login", "/expired", "/dashboard" })
    public String forward() {
        return "forward:/index.html";
    }
}