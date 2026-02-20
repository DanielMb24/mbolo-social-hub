package com.mbolo.auth.service;

import com.mbolo.auth.dto.*;
import com.mbolo.auth.model.PasswordResetToken;
import com.mbolo.auth.model.RefreshToken;
import com.mbolo.auth.model.UserAuth;
import com.mbolo.auth.repository.PasswordResetTokenRepository;
import com.mbolo.auth.repository.RefreshTokenRepository;
import com.mbolo.auth.repository.UserAuthRepository;
import com.mbolo.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAuthRepository userAuthRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

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

    public ApiResponse<String> forgotPassword(ForgotPasswordRequest request) {
        UserAuth user = userAuthRepository.findByEmail(request.getEmail()).orElse(null);
        
        if (user == null) {
            // Pour des raisons de sécurité, on ne révèle pas si l'email existe
            return ApiResponse.ok("Si cet email existe, un code de réinitialisation a été envoyé.");
        }

        // Supprimer les anciens tokens pour cet email
        passwordResetTokenRepository.deleteByEmail(request.getEmail());

        // Générer un code OTP à 6 chiffres
        String otp = generateOtp();

        // Sauvegarder le token
        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(request.getEmail());
        token.setOtp(otp);
        token.setExpiresAt(Instant.now().plusSeconds(600)); // 10 minutes
        passwordResetTokenRepository.save(token);

        // Envoyer l'email
        try {
            emailService.sendOtpEmail(request.getEmail(), otp, user.getUsername());
            log.info("Password reset OTP sent to: {}", request.getEmail());
        } catch (Exception e) {
            log.error("Failed to send OTP email", e);
            return ApiResponse.error("Erreur lors de l'envoi de l'email. Veuillez réessayer.");
        }

        return ApiResponse.ok("Un code de vérification a été envoyé à votre adresse email.");
    }

    public ApiResponse<String> resetPassword(ResetPasswordRequest request) {
        // Vérifier le token OTP
        PasswordResetToken token = passwordResetTokenRepository
                .findByEmailAndOtpAndUsedFalse(request.getEmail(), request.getOtp())
                .orElse(null);

        if (token == null) {
            return ApiResponse.error("Code OTP invalide ou expiré.");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            return ApiResponse.error("Le code OTP a expiré. Veuillez en demander un nouveau.");
        }

        // Trouver l'utilisateur
        UserAuth user = userAuthRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            return ApiResponse.error("Utilisateur introuvable.");
        }

        // Mettre à jour le mot de passe
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userAuthRepository.save(user);

        // Marquer le token comme utilisé
        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        // Supprimer tous les refresh tokens de l'utilisateur pour forcer une nouvelle connexion
        refreshTokenRepository.deleteByUserId(user.getId());

        log.info("Password reset successful for user: {}", user.getUsername());
        return ApiResponse.ok("Votre mot de passe a été réinitialisé avec succès.");
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000); // Génère un nombre entre 100000 et 999999
        return String.valueOf(otp);
    }
}
