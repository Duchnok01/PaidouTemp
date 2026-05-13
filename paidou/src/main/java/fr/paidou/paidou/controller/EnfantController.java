package fr.paidou.paidou.controller;

import fr.paidou.paidou.service.EnfantService;
import fr.paidou.paidou.model.Enfant;

import java.time.LocalDate;
import java.util.List;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.UserService;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

//@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/enfants")
public class EnfantController {

    private final EnfantService enfantService;
    
    private final SecurityUtils securityUtils;
    private final UserService userService;
    
    public EnfantController(EnfantService enfantService, SecurityUtils securityUtils, UserService userService) {
        this.enfantService = enfantService;
        this.securityUtils = securityUtils;
        this.userService = userService;
    }

   
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createEnfant(@RequestBody CreateEnfantRequest request) {
        try {
            enfantService.createEnfant(
                request.nom(),
                request.prenom(),
                request.dateDeNaissance(),
                request.nomCreche()
        );
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteEnfant(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) return ResponseEntity.status(403).build();
            Long id = Long.parseLong(request.get("id"));
            String mdp = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdp))
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            enfantService.deleteEnfantPhysique(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }




    @GetMapping("/all")
    public ResponseEntity<List<EnfantSummaryDTO>> getAllEnfantsByCreche(@RequestParam String nomCreche) {
        try {
            List<EnfantSummaryDTO> enfants = enfantService.getAllEnfantsByCreche(nomCreche).stream()
                    .map(e -> new EnfantSummaryDTO(
                            e.getId_enfant(),
                            e.getNom(),
                            e.getPrenom(),
                            e.getDateDeNaissance(),
                            e.getCreche().getNom()
                    ))
                    .toList();
            return ResponseEntity.ok(enfants);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }


    @PutMapping("/change-creche")
    public ResponseEntity<Void> changeCreche(@RequestBody ChangeCrecheRequest request) {
        enfantService.changeCreche(request.id(), request.nomCreche());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/rectifier")
    public ResponseEntity<Void> rectifierInfos(@RequestBody RectifierInfosRequest request) {
        enfantService.rectifierInfos(
                request.id(),
                request.nom(),
                request.prenom(),
                request.dateDeNaissance()
        );
        return ResponseEntity.ok().build();
    }

    @PutMapping("/disable")
    public ResponseEntity<Void> disableChild(@RequestBody DisableChildRequest request) {
        enfantService.disableChildAccount(request.id());
        return ResponseEntity.ok().build();
    }



    @PutMapping("/transfer-all")
    public ResponseEntity<?> transferAllEnfants(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            String from = request.get("from");
            String to = request.get("to");
            String mdpAdmin = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdpAdmin)) {
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            }
            enfantService.transferAllEnfants(from, to);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
































    // ======== LECTURE ========

    @GetMapping
    public ResponseEntity<List<EnfantSummaryDTO>> getEnfantsByCreche(@RequestParam String nomCreche) {
        try {
            List<EnfantSummaryDTO> enfants = enfantService.getEnfantsByCreche(nomCreche).stream()
                    .map(e -> new EnfantSummaryDTO(
                            e.getId_enfant(),
                            e.getNom(),
                            e.getPrenom(),
                            e.getDateDeNaissance(),
                            e.getCreche().getNom()
                    ))
                    .toList();
            return ResponseEntity.ok(enfants);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnfantDetailDTO> getEnfantById(@PathVariable Long id) {
        try {
            Enfant enfant = enfantService.getEnfantById(id);
            EnfantDetailDTO dto = new EnfantDetailDTO(
                    enfant.getId_enfant(),
                    enfant.getNom(),
                    enfant.getPrenom(),
                    enfant.getDateDeNaissance(),
                    enfant.getCreche().getNom()
            );
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace(); // <-- ajoute cette ligne
            return ResponseEntity.status(500).build();
        }
    }









    







    // ======== DTOs ========

    public record CreateEnfantRequest(
            String nom,
            String prenom,
            LocalDate dateDeNaissance,
            String nomCreche
    ) {}

    public record ChangeCrecheRequest(Long id, String nomCreche) {}

    public record RectifierInfosRequest(
            Long id,
            String nom,
            String prenom,
            LocalDate dateDeNaissance
    ) {}

    public record DisableChildRequest(Long id) {}

    public record EnfantSummaryDTO(
            Long id,
            String nom,
            String prenom,
            LocalDate dateDeNaissance,
            String nomCreche
    ) {}

    public record EnfantDetailDTO(
            Long id,
            String nom,
            String prenom,
            LocalDate dateDeNaissance,
            String nomCreche
    ) {}
}