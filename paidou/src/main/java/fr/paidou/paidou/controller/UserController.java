package fr.paidou.paidou.controller;

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
//@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityUtils securityUtils; 

    public UserController(  UserService userService,
                            AuthenticationManager authenticationManager,
                            SecurityUtils securityUtils
                        ) 
    {  
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.securityUtils = securityUtils; 
    }

    // DTO login (record)
    public record LoginRequest(String prenom, String mdp) {}

    @PostMapping("/create")
    public ResponseEntity<String> createUser(@RequestParam String prenom) {
        try {
            String mdp = userService.createUser(prenom);
            return ResponseEntity.ok("Utilisateur créé. Mot de passe : " + mdp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<String[]> login(@RequestBody LoginRequest requestDto,
                                        HttpServletRequest request) {

        try {
            // 1. Création du token
            UsernamePasswordAuthenticationToken token =
                    new UsernamePasswordAuthenticationToken(
                            requestDto.prenom().toLowerCase(),
                            requestDto.mdp()
                    );

            // 2. Authentification via Spring Security
            Authentication auth = authenticationManager.authenticate(token);

            // 3. Stockage dans le SecurityContext
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);

            // 4. Stockage en session HTTP (CRITIQUE)
            HttpSession session = request.getSession(true);
            session.setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    context
            );

            // 5. Logique métier (redirect info)
            String[] result = userService.getRedirectInfo(requestDto.prenom());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity
                    .status(401)
                    .body(new String[]{"Identifiants incorrects"});
        }
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

    @PutMapping("/fix-name")
    public ResponseEntity<String> fixName(@RequestParam String ancienPrenom, @RequestParam String nouveauPrenom) {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            userService.fixNameTypo(ancienPrenom, nouveauPrenom);
            return ResponseEntity.ok("Prénom corrigé");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PutMapping("/disable")
    public ResponseEntity<?> disableUser(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            userService.disableUserAccount(request.get("prenom"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
        public ResponseEntity<UserSummaryDTO> getCurrentUser(Authentication authentication) {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            User user = userService.getUserByPrenom(authentication.getName().toLowerCase());
            return ResponseEntity.ok(new UserSummaryDTO(user.getId(), user.getPrenom(), user.getRole(), user.isEstParti()));
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




    @GetMapping
    public ResponseEntity<List<UserSummaryDTO>> getAllUsers() {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            List<UserSummaryDTO> users = userService.getAllUsers().stream()
                    .map(u -> new UserSummaryDTO(u.getId(), u.getPrenom(), u.getRole(), u.isEstParti()))
                    .toList();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }




    @PutMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            String prenom = request.get("prenom");
            String nouveauMdp = userService.resetPassword(prenom);
            return ResponseEntity.ok("Mot de passe réinitialisé. Nouveau mot de passe : " + nouveauMdp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }






    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            String prenom = request.get("prenom");
            String mdpAdmin = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdpAdmin)) {
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            }
            userService.deleteUser(prenom);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }



































    // DTO
    public record SetPasswordRequest(String nouveauMdp) {}
    
    public record UserSummaryDTO(Long id, String prenom, String role, boolean estParti) {}



}