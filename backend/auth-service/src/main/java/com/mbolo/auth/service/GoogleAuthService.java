package com.mbolo.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.mbolo.auth.dto.AuthResponse;
import com.mbolo.auth.model.RefreshToken;
import com.mbolo.auth.model.UserAuth;
import com.mbolo.auth.repository.RefreshTokenRepository;
import com.mbolo.auth.repository.UserAuthRepository;
import com.mbolo.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserAuthRepository userAuthRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${google.client-id}")
    private String googleClientId;

    public AuthResponse authenticateWithGoogle(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), 
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            
            if (idToken == null) {
                return new AuthResponse(false, null, null, null, "Token Google invalide");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            
            // Chercher ou créer l'utilisateur
            UserAuth user = userAuthRepository.findByEmail(email)
                    .orElseGet(() -> {
                        UserAuth newUser = new UserAuth();
                        newUser.setEmail(email);
                        newUser.setUsername(email.split("@")[0]);
                        newUser.setFullName(name);
                        newUser.setPassword(""); // Pas de mot de passe pour OAuth
                        newUser.setGoogleId(payload.getSubject());
                        newUser.setProfilePicture(pictureUrl);
                        newUser.setEmailVerified(true);
                        return userAuthRepository.save(newUser);
                    });

            // Générer les tokens
            String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getRoles());
            String refreshToken = saveRefreshToken(user.getId());

            log.info("Google authentication successful for user: {}", email);
            return new AuthResponse(true, accessToken, refreshToken, user.getId(), "Connexion Google réussie");

        } catch (Exception e) {
            log.error("Google authentication failed", e);
            return new AuthResponse(false, null, null, null, "Erreur lors de l'authentification Google");
        }
    }

    private String saveRefreshToken(String userId) {
        String tokenStr = jwtTokenProvider.generateRefreshToken(userId);
        RefreshToken rt = new RefreshToken();
        rt.setUserId(userId);
        rt.setToken(tokenStr);
        rt.setExpiresAt(Instant.now().plusMillis(604800000));
        refreshTokenRepository.save(rt);
        return tokenStr;
    }
}
