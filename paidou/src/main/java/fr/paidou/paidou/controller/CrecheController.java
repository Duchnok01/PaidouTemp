package fr.paidou.paidou.controller;

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

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createCreche(@RequestBody CreateCrecheRequest request) {
        try {
            crecheService.createCreche(request.nom(), request.directeur());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<CrecheSummaryDTO>> getAllCreches() {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            return ResponseEntity.ok(crecheService.getAllCrechesWithInfos());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/mes-creches")
    public ResponseEntity<List<CrecheSummaryDTO>> getMesCreches() {
        try {
            return ResponseEntity.ok(crecheService.getMesCrechesWithInfos());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/change-directeur")
    public ResponseEntity<?> changeDirecteur(@RequestBody ChangeDirecteurRequest request) {
        try {
            crecheService.changeDirecteur(request.nom(), request.directeur());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/rename")
    public ResponseEntity<?> renameCreche(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) return ResponseEntity.status(403).build();
            String ancienNom = request.get("ancienNom");
            String nouveauNom = request.get("nouveauNom");
            String mdpAdmin = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdpAdmin)) {
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            }
            crecheService.renameCreche(ancienNom, nouveauNom);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/fermer")
    public ResponseEntity<?> fermerCreche(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) return ResponseEntity.status(403).build();
            String nom = request.get("nom");
            String mdpAdmin = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdpAdmin)) {
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            }
            crecheService.fermerCreche(nom);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }




    @GetMapping("/toutes")
    public ResponseEntity<List<CrecheSummaryDTO>> getToutesLesCreches() {
        try {
            return ResponseEntity.ok(crecheService.getAllCrechesWithInfos());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/transferer-enfants")
    public ResponseEntity<?> transfererEnfants(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) return ResponseEntity.status(403).build();
            String from = request.get("from");
            String to = request.get("to");
            String mdpAdmin = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdpAdmin)) {
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            }
            crecheService.transfererTousEnfants(from, to);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteCreche(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) return ResponseEntity.status(403).build();
            String nom = request.get("nom");
            String mdpAdmin = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdpAdmin)) {
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            }
            crecheService.deleteCreche(nom);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record CreateCrecheRequest(String nom, String directeur) {}
    public record ChangeDirecteurRequest(String nom, String directeur) {}
    public record CrecheSummaryDTO(String nom, String directeurPrenom, boolean estFerme, long nbEnfants) {}
}