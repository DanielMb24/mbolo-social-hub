package com.mbolo.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:noreply@mbolo.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Mbolo - Code de réinitialisation de mot de passe");
            message.setText(buildOtpEmailContent(username, otp));
            
            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
            throw new RuntimeException("Échec de l'envoi de l'email. Veuillez réessayer.");
        }
    }

    private String buildOtpEmailContent(String username, String otp) {
        return String.format("""
            Bonjour %s,
            
            Vous avez demandé la réinitialisation de votre mot de passe sur Mbolo.
            
            Votre code de vérification est : %s
            
            Ce code est valide pendant 10 minutes.
            
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            
            Cordialement,
            L'équipe Mbolo
            """, username, otp);
    }
}
