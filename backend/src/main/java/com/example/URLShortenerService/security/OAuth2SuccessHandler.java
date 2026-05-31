package com.example.URLShortenerService.security;

import com.example.URLShortenerService.entity.User;
import com.example.URLShortenerService.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        if (!(authentication instanceof OAuth2AuthenticationToken)) {
            super.onAuthenticationSuccess(request, response, authentication);
            return;
        }

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String provider = oauthToken.getAuthorizedClientRegistrationId();
        OAuth2User oauthUser = oauthToken.getPrincipal();
        Map<String, Object> attributes = oauthUser.getAttributes();

        String email = null;
        String name = null;
        String avatarUrl = null;
        String providerId = null;

        if ("google".equalsIgnoreCase(provider)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
            avatarUrl = (String) attributes.get("picture");
            providerId = (String) attributes.get("sub");
        } else if ("github".equalsIgnoreCase(provider)) {
            providerId = String.valueOf(attributes.get("id"));
            email = (String) attributes.get("email");
            if (email == null) {
                String login = (String) attributes.get("login");
                email = login + "@github.com";
            }
            name = (String) attributes.get("name");
            if (name == null) {
                name = (String) attributes.get("login");
            }
            avatarUrl = (String) attributes.get("avatar_url");
        }

        if (email == null) {
            log.error("Email not found from OAuth2 provider {}", provider);
            response.sendRedirect("/login?error=email_not_provided");
            return;
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .name(name != null ? name : "OAuth User")
                    .provider(provider)
                    .providerId(providerId)
                    .avatarUrl(avatarUrl)
                    .build();
        } else {
            user.setName(name != null ? name : user.getName());
            user.setAvatarUrl(avatarUrl != null ? avatarUrl : user.getAvatarUrl());
        }
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getName());
        log.info("Successfully authenticated user [{}] via {}. Generated JWT.", email, provider);

        String targetUrl;
        String host = request.getHeader("Host");
        if (host != null && (host.contains("localhost:") || host.contains("127.0.0.1:"))) {
            targetUrl = "http://localhost:5173/login?token=" + token;
        } else {
            targetUrl = "/login?token=" + token;
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
