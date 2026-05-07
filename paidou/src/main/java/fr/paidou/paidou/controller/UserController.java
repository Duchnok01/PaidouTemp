package fr.paidou.paidou.controller;

import fr.paidou.paidou.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;

    public UserController(UserService userService,
                          AuthenticationManager authenticationManager) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
    }

    // DTO login (record)
    public record LoginRequest(String prenom, String mdp) {}

    @PostMapping("/create")
    public ResponseEntity<String> createUser(@RequestParam String prenom) {
        String mdp = userService.createUser(prenom);
        return ResponseEntity.ok("Utilisateur créé. Mot de passe : " + mdp);
    }

    @PostMapping("/login")
    public ResponseEntity<String[]> login(@RequestBody LoginRequest requestDto,
                                          HttpServletRequest request) {

        try {
            // 1. Création du token
            UsernamePasswordAuthenticationToken token =
                    new UsernamePasswordAuthenticationToken(
                            requestDto.prenom(),
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
            // L'utilisateur connecté
            String prenom = authentication.getName(); // le username = prénom normalisé
            userService.setPassword(prenom, dto.nouveauMdp());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur serveur");
        }
    }

    // DTO
    public record SetPasswordRequest(String nouveauMdp) {}




}