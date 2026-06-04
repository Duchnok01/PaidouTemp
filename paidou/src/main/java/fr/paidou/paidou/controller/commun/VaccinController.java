package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.UserService;
import fr.paidou.paidou.service.VaccinService;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // ==================== POST ====================

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createVaccin(@RequestBody CreateVaccinRequest request) {
        if (!securityUtils.hasPermission("CREER_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        try {
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

    // ==================== PUT ====================

    @PutMapping("/edit")
    public ResponseEntity<Void> editVaccin(@RequestBody EditVaccinRequest request) {
        if (!securityUtils.hasPermission("MODIFIER_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.mdpAdmin();
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).build();
        }
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

    @PutMapping("/rendre-obsolete")
    public ResponseEntity<?> rendreObsolete(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("RENDRE_OBSOLETE_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            Long id = Long.parseLong(request.get("id"));
            vaccinService.rendreObsolete(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/reactiver")
    public ResponseEntity<?> reactiverVaccin(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("REACTIVER_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            Long id = Long.parseLong(request.get("id"));
            vaccinService.reactiverVaccin(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== DELETE ====================

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteVaccin(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("SUPPRIMER_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        String mdp = request.get("mdpAdmin");
        if (mdp == null || !userService.verifyPassword(securityUtils.getRealUser().getPrenom(), mdp)) {
            return ResponseEntity.status(403).body("Mot de passe incorrect");
        }
        try {
            Long id = Long.parseLong(request.get("id"));
            vaccinService.deleteVaccinPhysique(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== GET ====================

    @GetMapping
    public ResponseEntity<List<VaccinSummaryDTO>> getAllVaccins(
            @RequestParam(required = false, defaultValue = "false") boolean inclureObsoletes) {
        try {
            // Seuls superadmin et pdg peuvent voir les vaccins obsolètes
            if (inclureObsoletes && !securityUtils.hasPermission("VOIR_TOUS_VACCINS")) {
                inclureObsoletes = false;
            }
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

    @GetMapping("/pour-enfant/{id}")
    public ResponseEntity<List<VaccinPourEnfantDTO>> getVaccinsPourEnfant(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(vaccinService.getVaccinsPourEnfant(id));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ==================== DTOs ====================

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
            Integer nbMoisDeuxiemeDelai,
            String mdpAdmin
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

    public record VaccinPourEnfantDTO(Long id, String nom, long dosesRecues, int dosesRequises, boolean complet) {}
}