package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.CrecheService;
import fr.paidou.paidou.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/creches")
public class CrecheController {

    private final CrecheService crecheService;
    private final SecurityUtils securityUtils;
    private final UserService userService;

    public CrecheController(CrecheService crecheService, SecurityUtils securityUtils, UserService userService) {
        this.crecheService = crecheService;
        this.securityUtils = securityUtils;
        this.userService = userService;
    }

    // ==================== POST ====================

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createCreche(@RequestBody CreateCrecheRequest request) {
        if (!securityUtils.hasPermission("CREER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        try {
            crecheService.createCreche(request.nom(), request.directeur());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== GET ====================

    @GetMapping
    public ResponseEntity<List<CrecheSummaryDTO>> getAllCreches() {
        if (!securityUtils.hasPermission("VOIR_TOUTES_CRECHES")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(crecheService.getAllCrechesWithInfos());
    }

    @GetMapping("/mes-creches")
    public ResponseEntity<List<CrecheSummaryDTO>> getMesCreches() {
        return ResponseEntity.ok(crecheService.getMesCrechesWithInfos());
    }

    @GetMapping("/toutes")
    public ResponseEntity<List<CrecheSummaryDTO>> getToutesLesCreches() {
        if (!securityUtils.hasPermission("VOIR_TOUTES_CRECHES")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(crecheService.getAllCrechesWithInfos());
    }

    // ==================== PUT ====================

    @PutMapping("/change-directeur")
    public ResponseEntity<?> changeDirecteur(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CHANGER_DIRECTRICE")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            crecheService.changeDirecteur(request.get("nom"), request.get("directeur"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/rename")
    public ResponseEntity<?> renameCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("RENOMMER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            crecheService.renameCreche(request.get("ancienNom"), request.get("nouveauNom"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/fermer")
    public ResponseEntity<?> fermerCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("FERMER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            crecheService.fermerCreche(request.get("nom"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/rouvrir")
    public ResponseEntity<?> rouvrirCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("ROUVRIR_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            crecheService.rouvrirCreche(request.get("nom"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/transferer-enfants")
    public ResponseEntity<?> transfererEnfants(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CHANGER_CRECHE_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            crecheService.transfererTousEnfants(request.get("from"), request.get("to"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== DELETE ====================

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("SUPPRIMER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            crecheService.deleteCreche(request.get("nom"));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== DTOs ====================

    public record CreateCrecheRequest(String nom, String directeur) {}
    public record CrecheSummaryDTO(String nom, String directeurPrenom, boolean estFerme, long nbEnfants) {}
}