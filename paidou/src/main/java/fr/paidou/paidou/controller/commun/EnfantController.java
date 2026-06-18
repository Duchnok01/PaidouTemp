package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.service.EnfantService;
import fr.paidou.paidou.model.Enfant;

import java.time.LocalDate;
import java.util.List;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.UserService;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // ==================== POST ====================

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createEnfant(@RequestBody CreateEnfantRequest request) {
        if (!securityUtils.hasPermission("CREER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
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

    // ==================== PUT ====================

    @PutMapping("/change-creche")
    public ResponseEntity<Void> changeCreche(@RequestBody ChangeCrecheRequest request) {
        if (!securityUtils.hasPermission("CHANGER_CRECHE_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        // MDP requis pour cette action sensible
        String mdp = request.mdpAdmin();
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).build();
        }
        enfantService.changeCreche(request.id(), request.nomCreche());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/rectifier")
    public ResponseEntity<Void> rectifierInfos(@RequestBody RectifierInfosRequest request) {
        if (!securityUtils.hasPermission("MODIFIER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.mdpAdmin();
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).build();
        }
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
        if (!securityUtils.hasPermission("DESACTIVER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.mdpAdmin();
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).build();
        }
        enfantService.disableChildAccount(request.id());
        return ResponseEntity.ok().build();
    }

    // ==================== GET ====================

    @GetMapping("/all")
    public ResponseEntity<List<EnfantSummaryDTO>> getAllEnfantsByCreche(@RequestParam String nomCreche) {
        if (!securityUtils.isProprietaireCreche(securityUtils.getCurrentUser(), nomCreche)) {
            return ResponseEntity.status(403).build();
        }
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

    @GetMapping
    public ResponseEntity<List<EnfantSummaryDTO>> getEnfantsByCreche(@RequestParam String nomCreche) {
        if (!securityUtils.isProprietaireCreche(securityUtils.getCurrentUser(), nomCreche)) {
            return ResponseEntity.status(403).build();
        }
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
            if (!securityUtils.isProprietaireCreche(securityUtils.getCurrentUser(), enfant.getCreche().getNom())) {
                return ResponseEntity.status(403).build();
            }
            EnfantDetailDTO dto = new EnfantDetailDTO(
                    enfant.getId_enfant(),
                    enfant.getNom(),
                    enfant.getPrenom(),
                    enfant.getDateDeNaissance(),
                    enfant.getCreche().getNom()
            );
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}/statut-vaccinal")
    public ResponseEntity<List<VaccinStatusDTO>> getStatutVaccinal(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(enfantService.getStatutVaccinal(id));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/statuts-vaccinaux")
    public ResponseEntity<List<EnfantStatutGlobalDTO>> getStatutsVaccinaux(@RequestParam String nomCreche) {
        if (!securityUtils.isProprietaireCreche(securityUtils.getCurrentUser(), nomCreche)) {
            return ResponseEntity.status(403).build();
        }
        try {
            return ResponseEntity.ok(enfantService.getStatutsVaccinauxParCreche(nomCreche));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ======== DTOs avec mdpAdmin quand nécessaire ========

    public record CreateEnfantRequest(
            String nom,
            String prenom,
            LocalDate dateDeNaissance,
            String nomCreche
    ) {}

    public record ChangeCrecheRequest(Long id, String nomCreche, String mdpAdmin) {}

    public record RectifierInfosRequest(
            Long id,
            String nom,
            String prenom,
            LocalDate dateDeNaissance,
            String mdpAdmin
    ) {}

    public record DisableChildRequest(Long id, String mdpAdmin) {}

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

    public record VaccinStatusDTO(
        Long idVaccin, String nomVaccin, long dosesRecues, int dosesRequises,
        LocalDate dateDose1Recommandee, LocalDate dateDose2Recommandee, LocalDate dateDose3Recommandee,
        String statut
    ) {}

    public record EnfantStatutGlobalDTO(
        Long id, String nom, String prenom, LocalDate dateDeNaissance,
        String statut, String nomVaccin, long jours, LocalDate datePrevue
    ) {}
}
