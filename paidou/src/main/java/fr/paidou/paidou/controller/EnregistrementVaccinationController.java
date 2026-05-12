package fr.paidou.paidou.controller;

import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.service.EnregistrementVaccinationService;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

//@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/enregistrements-vaccination")
public class EnregistrementVaccinationController {

    private final EnregistrementVaccinationService enregistrementService;

    public EnregistrementVaccinationController(EnregistrementVaccinationService enregistrementService) {
        this.enregistrementService = enregistrementService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> createEnregistrement(@RequestBody CreateEnregistrementRequest request) {
        enregistrementService.createEnregistrement(
                request.idEnfant(),
                request.idVaccin(),
                request.dateVaccination(),
                request.nomCreche(),
                request.idUser()
        );
        return ResponseEntity.ok().build();
    }

    @PutMapping("/edit")
    public ResponseEntity<Void> editEnregistrement(@RequestBody EditEnregistrementRequest request) {
        enregistrementService.editEnregistrement(
                request.idEnfant(),
                request.idVaccin(),
                request.ancienneDate(),
                request.newIdVaccin(),
                request.nouvelleDate()
        );
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteEnregistrement(@RequestBody DeleteEnregistrementRequest request) {
        enregistrementService.deleteEnregistrement(
                request.idEnfant(),
                request.idVaccin(),
                request.dateVaccination()
        );
        return ResponseEntity.ok().build();
    }

    // ======== LECTURE ========

    @GetMapping
    public ResponseEntity<List<EnregistrementSummaryDTO>> getEnregistrements(
            @RequestParam(required = false) Long idEnfant,
            @RequestParam(required = false) String nomCreche) {
        try {
            List<EnregistrementVaccination> enregistrements;

            if (idEnfant != null) {
                enregistrements = enregistrementService.getEnregistrementsByEnfant(idEnfant);
            } else if (nomCreche != null) {
                enregistrements = enregistrementService.getEnregistrementsByCreche(nomCreche);
            } else {
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
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
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