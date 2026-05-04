package fr.paidou.paidou.controller;

import fr.paidou.paidou.service.EnregistrementVaccinationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@CrossOrigin(origins = "http://localhost:5173")
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

    // ================= DTOs =================

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
}