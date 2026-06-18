package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.model.User;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityUtils securityUtils;

    public AuthController(UserService userService,
                          AuthenticationManager authenticationManager,
                          SecurityUtils securityUtils) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.securityUtils = securityUtils;
    }

    // DTO login (record)
    public record LoginRequest(String prenom, String mdp) {}

    // ==================== AUTH ====================

    @PostMapping("/login")
    public ResponseEntity<String[]> login(@RequestBody LoginRequest requestDto,
                                        HttpServletRequest request) {
        try {
            UsernamePasswordAuthenticationToken token =
                    new UsernamePasswordAuthenticationToken(
                            requestDto.prenom().toLowerCase(),
                            requestDto.mdp()
                    );
            Authentication auth = authenticationManager.authenticate(token);
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
            HttpSession session = request.getSession(true);
            session.setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    context
            );
            String[] result = userService.getRedirectInfo(requestDto.prenom());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(new String[]{"Identifiants incorrects"});
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryDTO> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.getUserByPrenom(authentication.getName().toLowerCase());
        return ResponseEntity.ok(new UserSummaryDTO(user.getId(), user.getPrenom(), user.getRole(), user.isEstParti(), user.isDoitChangerMdp()));
    }

    @PutMapping("/set-password")
    public ResponseEntity<?> setPassword(@RequestBody SetPasswordRequest dto,
                                        Authentication authentication) {
        try {
            if (dto.nouveauMdp() == null || dto.nouveauMdp().isBlank()) {
                return ResponseEntity.badRequest().body("Le mot de passe ne peut pas être vide");
            }
            if (dto.nouveauMdp().length() < 8) {
                return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 8 caractères");
            }
            String prenom = authentication.getName();
            userService.setPassword(prenom, dto.nouveauMdp());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur serveur");
        }
    }

    // ==================== USERS (protégé par permissions) ====================

    @PutMapping("/fix-name")
    public ResponseEntity<String> fixName(@RequestParam String ancienPrenom, @RequestParam String nouveauPrenom) {
        if (!securityUtils.hasPermission("RENOMMER_UTILISATEUR")) {
            return ResponseEntity.status(403).build();
        }
        try {
            userService.fixNameTypo(ancienPrenom, nouveauPrenom);
            return ResponseEntity.ok("Prénom corrigé");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/disable")
    public ResponseEntity<?> disableUser(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("DESACTIVER_UTILISATEUR")) {
            return ResponseEntity.status(403).build();
        }
        try {
            userService.disableUserAccount(request.get("prenom"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/reactiver")
    public ResponseEntity<?> reactiverUser(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("REACTIVER_UTILISATEUR")) {
            return ResponseEntity.status(403).build();
        }
        try {
            userService.reactiverUser(request.get("prenom"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryDTO>> getAllUsers() {
        if (!securityUtils.hasPermission("VOIR_TOUS_UTILISATEURS")) {
            return ResponseEntity.status(403).build();
        }
        List<UserSummaryDTO> users = userService.getAllUsers().stream()
                .map(u -> new UserSummaryDTO(u.getId(), u.getPrenom(), u.getRole(), u.isEstParti(), u.isDoitChangerMdp()))
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("RESET_MDP_UTILISATEUR")) {
            return ResponseEntity.status(403).build();
        }
        try {
            String prenom = request.get("prenom");
            String nouveauMdp = userService.resetPassword(prenom);
            return ResponseEntity.ok("Mot de passe réinitialisé. Nouveau mot de passe : " + nouveauMdp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("SUPPRIMER_UTILISATEUR")) {
            return ResponseEntity.status(403).build();
        }
        String mdpAdmin = request.get("mdpAdmin");
        if (mdpAdmin == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdpAdmin)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            userService.deleteUser(request.get("prenom"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== DTO ====================

    public record SetPasswordRequest(String nouveauMdp) {}

    public record UserSummaryDTO(Long id, String prenom, String role, boolean estParti, boolean doitChangerMdp) {}
}
