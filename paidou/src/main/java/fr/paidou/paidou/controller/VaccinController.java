package fr.paidou.paidou.controller;

import fr.paidou.paidou.service.VaccinService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/vaccins")
public class VaccinController {

    private final VaccinService vaccinService;

    public VaccinController(VaccinService vaccinService) {
        this.vaccinService = vaccinService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> createVaccin(@RequestBody CreateVaccinRequest request) {
        vaccinService.createVaccin(
                request.nom(),
                request.listeMaladies(),
                request.pourEnfantsNesAvant(),
                request.pourEnfantsNesApres(),
                request.agePremiereVaccination(),
                request.nbMoisPremierDelai(),
                request.nbMoisDeuxiemeDelai()
        );
        return ResponseEntity.ok().build();
    }

    @PutMapping("/edit")
    public ResponseEntity<Void> editVaccin(@RequestBody EditVaccinRequest request) {
        vaccinService.editVaccin(
                request.id(),
                request.nom(),
                request.listeMaladies(),
                request.pourEnfantsNesAvant(),
                request.pourEnfantsNesApres(),
                request.agePremiereVaccination(),
                request.nbMoisPremierDelai(),
                request.nbMoisDeuxiemeDelai()
        );
        return ResponseEntity.ok().build();
    }

    // ================= DTOs =================

    public record CreateVaccinRequest(
            String nom,
            String listeMaladies,
            Integer pourEnfantsNesAvant,
            Integer pourEnfantsNesApres,
            Integer agePremiereVaccination,
            Integer nbMoisPremierDelai,
            Integer nbMoisDeuxiemeDelai
    ) {}

    public record EditVaccinRequest(
            Long id,
            String nom,
            String listeMaladies,
            Integer pourEnfantsNesAvant,
            Integer pourEnfantsNesApres,
            Integer agePremiereVaccination,
            Integer nbMoisPremierDelai,
            Integer nbMoisDeuxiemeDelai
    ) {}
}