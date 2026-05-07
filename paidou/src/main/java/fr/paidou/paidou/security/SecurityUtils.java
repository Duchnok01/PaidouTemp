package fr.paidou.paidou.security;

import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private final UserRepository userRepository;

    public SecurityUtils(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Renvoie l'utilisateur connecté
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("Aucun utilisateur connecté");
        }
        String prenom = auth.getName();
        User user = userRepository.findByPrenom(prenom)
                .orElseThrow(() -> new IllegalStateException("Utilisateur connecté introuvable en base"));
        if (user.isEstParti()) {
            throw new SecurityException("Compte désactivé");
        }
        return user;
    }

    // Vérifie si l'utilisateur actuel est ADMIN
    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}