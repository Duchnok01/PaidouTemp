package fr.paidou.paidou.controller;

import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.UserService;
import fr.paidou.paidou.service.VaccinService;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

//@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/vaccins")
public class VaccinController {

    private final VaccinService vaccinService;
    private final UserService userService;
    private final SecurityUtils securityUtils; 

    public VaccinController(VaccinService vaccinService, SecurityUtils securityUtils, UserService userService) {
        this.vaccinService = vaccinService;
        this.userService = userService;
        this.securityUtils = securityUtils;
    }

    

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createVaccin(@RequestBody CreateVaccinRequest request) {
        
        try
        {
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
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());            
        }
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



    @GetMapping
    public ResponseEntity<List<VaccinSummaryDTO>> getAllVaccins(
            @RequestParam(required = false, defaultValue = "false") boolean inclureObsoletes) {
        try {
            List<Vaccin> vaccins = inclureObsoletes 
                ? vaccinService.getAllVaccinsAdmin() 
                : vaccinService.getAllVaccins();
            List<VaccinSummaryDTO> dtos = vaccins.stream()
                    .map(v -> new VaccinSummaryDTO(
                        v.getId(), v.getNom(), v.getMaladiesPrevenues(),
                        v.getPourEnfantsNesAvant(), v.getPourEnfantsNesApres(),
                        v.getAgePremiereVaccination(), v.getNbMoisPremierDelai(),
                        v.getNbMoisDeuxiemeDelai(), v.isEstObsolete()
                    ))
                    .toList();
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }



    



    @PutMapping("/rendre-obsolete")
    public ResponseEntity<?> rendreObsolete(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            Long id = Long.parseLong(request.get("id"));
            String mdpAdmin = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdpAdmin)) {
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            }
            vaccinService.rendreObsolete(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteVaccin(@RequestBody Map<String, String> request) {
        try {
            if (!securityUtils.isAdmin()) return ResponseEntity.status(403).build();
            Long id = Long.parseLong(request.get("id"));
            String mdpAdmin = request.get("mdpAdmin");
            if (!userService.verifyPassword(securityUtils.getCurrentUser().getPrenom(), mdpAdmin))
                return ResponseEntity.status(403).body("Mot de passe admin incorrect");
            vaccinService.deleteVaccinPhysique(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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

    public record VaccinSummaryDTO(
        Long id,
        String nom,
        String maladiesPrevenues,
        Integer pourEnfantsNesAvant,
        Integer pourEnfantsNesApres,
        Integer agePremiereVaccination,
        Integer nbMoisPremierDelai,
        Integer nbMoisDeuxiemeDelai,
        boolean estObsolete
    ) {}












}