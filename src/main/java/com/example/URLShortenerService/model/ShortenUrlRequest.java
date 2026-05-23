package com.example.URLShortenerService.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ShortenUrlRequest {

    @NotBlank(message = "URL must not be blank")
    @Pattern(
        regexp = "^(https?://)[\\w\\-]+(\\.[\\w\\-]+)+(/[\\w\\-./?%&=]*)?$",
        message = "Must be a valid HTTP or HTTPS URL"
    )
    private String url;
}
