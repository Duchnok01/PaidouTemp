package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.EnregistrementVaccinationService;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/enregistrements-vaccination")
public class EnregistrementController {

    private final EnregistrementVaccinationService enregistrementService;
    private final SecurityUtils securityUtils;

    public EnregistrementController(EnregistrementVaccinationService enregistrementService,
                                    SecurityUtils securityUtils) {
        this.enregistrementService = enregistrementService;
        this.securityUtils = securityUtils;
    }

    // ==================== POST ====================

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> createEnregistrement(@RequestBody CreateEnregistrementRequest request) {
        if (!securityUtils.hasPermission("CREER_ENREGISTREMENT")) {
            return ResponseEntity.status(403).build();
        }
        enregistrementService.createEnregistrement(
                request.idEnfant(),
                request.idVaccin(),
                request.dateVaccination(),
                request.nomCreche(),
                request.idUser()
        );
        return ResponseEntity.ok().build();
    }

    // ==================== PUT ====================

    @PutMapping("/edit")
    public ResponseEntity<Void> editEnregistrement(@RequestBody EditEnregistrementRequest request) {
        if (!securityUtils.hasPermission("MODIFIER_ENREGISTREMENT")) {
            return ResponseEntity.status(403).build();
        }
        enregistrementService.editEnregistrement(
                request.idEnfant(),
                request.idVaccin(),
                request.ancienneDate(),
                request.newIdVaccin(),
                request.nouvelleDate()
        );
        return ResponseEntity.ok().build();
    }

    // ==================== DELETE ====================

    @DeleteMapping
    public ResponseEntity<Void> deleteEnregistrement(@RequestBody DeleteEnregistrementRequest request) {
        if (!securityUtils.hasPermission("SUPPRIMER_ENREGISTREMENT")) {
            return ResponseEntity.status(403).build();
        }
        enregistrementService.deleteEnregistrement(
                request.idEnfant(),
                request.idVaccin(),
                request.dateVaccination()
        );
        return ResponseEntity.ok().build();
    }

    // ==================== GET ====================

    @GetMapping
    public ResponseEntity<List<EnregistrementSummaryDTO>> getEnregistrements(
            @RequestParam(required = false) Long idEnfant,
            @RequestParam(required = false) String nomCreche) {
        List<EnregistrementVaccination> enregistrements;

        if (idEnfant != null) {
            enregistrements = enregistrementService.getEnregistrementsByEnfant(idEnfant);
        } else if (nomCreche != null) {
            if (!securityUtils.isProprietaireCreche(securityUtils.getCurrentUser(), nomCreche)) {
                return ResponseEntity.status(403).build();
            }
            enregistrements = enregistrementService.getEnregistrementsByCreche(nomCreche);
        } else {
            if (!securityUtils.hasPermission("VOIR_TOUS_ENREGISTREMENTS")) {
                return ResponseEntity.status(403).build();
            }
            return ResponseEntity.badRequest().build();
        }

        List<EnregistrementSummaryDTO> dtos = enregistrements.stream()
                .map(ev -> new EnregistrementSummaryDTO(
                        ev.getEnfant().getId_enfant(),
                        ev.getEnfant().getPrenom(),
                        ev.getEnfant().getNom(),
                        ev.getVaccin().getId(),
                        ev.getVaccin().getNom(),
                        ev.getId().getDateVaccination(),
                        ev.getUser().getPrenom()
                ))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // ======== DTOs ========

    public record CreateEnregistrementRequest(
            Long idEnfant,
            Long idVaccin,
            LocalDate dateVaccination,
            String nomCreche,
            Long idUser
    ) {}

    public record EditEnregistrementRequest(
            Long idEnfant,
            Long idVaccin,
            LocalDate ancienneDate,
            Long newIdVaccin,
            LocalDate nouvelleDate
    ) {}

    public record DeleteEnregistrementRequest(
            Long idEnfant,
            Long idVaccin,
            LocalDate dateVaccination
    ) {}

    public record EnregistrementSummaryDTO(
            Long idEnfant,
            String prenomEnfant,
            String nomEnfant,
            Long idVaccin,
            String nomVaccin,
            LocalDate dateVaccination,
            String prenomUtilisateur
    ) {}
}
