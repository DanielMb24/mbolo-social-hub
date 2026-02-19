package com.mbolo.auth.service;

import com.mbolo.auth.dto.*;
import com.mbolo.auth.model.RefreshToken;
import com.mbolo.auth.model.UserAuth;
import com.mbolo.auth.repository.RefreshTokenRepository;
import com.mbolo.auth.repository.UserAuthRepository;
import com.mbolo.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAuthRepository userAuthRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        if (userAuthRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse(false, null, null, null, "Ce nom d'utilisateur est déjà pris");
        }
        
        if (userAuthRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(false, null, null, null, "Cet email est déjà enregistré");
        }

        UserAuth user = new UserAuth();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userAuthRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getRoles());
        String refreshToken = saveRefreshToken(user.getId());

        return new AuthResponse(true, accessToken, refreshToken, user.getId(), "Inscription réussie");
    }

    public AuthResponse login(LoginRequest request) {
        // Essayer de trouver l'utilisateur par username, email ou phone
        UserAuth user = userAuthRepository.findByUsername(request.getUsername())
                .or(() -> userAuthRepository.findByEmail(request.getUsername()))
                .or(() -> userAuthRepository.findByPhone(request.getUsername()))
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new AuthResponse(false, null, null, null, "Identifiants incorrects");
        }

        if (!user.isActive()) {
            return new AuthResponse(false, null, null, null, "Compte désactivé");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getRoles());
        String refreshToken = saveRefreshToken(user.getId());

        return new AuthResponse(true, accessToken, refreshToken, user.getId(), "Connexion réussie");
    }

    public AuthResponse refreshToken(String token) {
        RefreshToken stored = refreshTokenRepository.findByToken(token).orElse(null);
        if (stored == null || stored.getExpiresAt().isBefore(Instant.now())) {
            return new AuthResponse(false, null, null, null, "Token invalide ou expiré");
        }

        UserAuth user = userAuthRepository.findById(stored.getUserId()).orElse(null);
        if (user == null) {
            return new AuthResponse(false, null, null, null, "Utilisateur introuvable");
        }

        refreshTokenRepository.delete(stored);
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getRoles());
        String newRefreshToken = saveRefreshToken(user.getId());

        return new AuthResponse(true, accessToken, newRefreshToken, user.getId(), "Token rafraîchi");
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
