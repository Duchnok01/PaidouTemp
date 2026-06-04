package fr.paidou.paidou.controller.superadmin;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.VaccinService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/superadmin/vaccins")
public class SuperAdminVaccinController {

    private final VaccinService vaccinService;
    private final SecurityUtils securityUtils;

    public SuperAdminVaccinController(VaccinService vaccinService, SecurityUtils securityUtils) {
        this.vaccinService = vaccinService;
        this.securityUtils = securityUtils;
    }

    // POST créer un vaccin
    @PostMapping
    public ResponseEntity<Void> createVaccin(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CREER_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        vaccinService.createVaccin(
            request.get("nom"),
            request.get("listeMaladies"),
            request.containsKey("neAvantLe") ? Integer.parseInt(request.get("neAvantLe")) : null,
            request.containsKey("neApresLe") ? Integer.parseInt(request.get("neApresLe")) : null,
            Integer.parseInt(request.get("agePremiereVaccination")),
            Integer.parseInt(request.get("nbMoisPremierDelai")),
            request.containsKey("nbMoisDeuxiemeDelai") ? Integer.parseInt(request.get("nbMoisDeuxiemeDelai")) : null
        );
        return ResponseEntity.ok().build();
    }

    // PUT modifier un vaccin
    @PutMapping("/edit")
    public ResponseEntity<Void> editVaccin(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("MODIFIER_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        vaccinService.editVaccin(
            Long.parseLong(request.get("id")),
            request.get("nom"),
            request.get("listeMaladies"),
            request.containsKey("neAvantLe") ? Integer.parseInt(request.get("neAvantLe")) : null,
            request.containsKey("neApresLe") ? Integer.parseInt(request.get("neApresLe")) : null,
            Integer.parseInt(request.get("agePremiereVaccination")),
            Integer.parseInt(request.get("nbMoisPremierDelai")),
            request.containsKey("nbMoisDeuxiemeDelai") ? Integer.parseInt(request.get("nbMoisDeuxiemeDelai")) : null
        );
        return ResponseEntity.ok().build();
    }

    // PUT rendre obsolète
    @PutMapping("/rendre-obsolete")
    public ResponseEntity<Void> rendreObsolete(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("RENDRE_OBSOLETE_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        vaccinService.rendreObsolete(Long.parseLong(request.get("id")));
        return ResponseEntity.ok().build();
    }

    // PUT réactiver
    @PutMapping("/reactiver")
    public ResponseEntity<Void> reactiverVaccin(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("REACTIVER_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        vaccinService.reactiverVaccin(Long.parseLong(request.get("id")));
        return ResponseEntity.ok().build();
    }

    // DELETE supprimer définitivement
    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteVaccin(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("SUPPRIMER_VACCIN")) {
            return ResponseEntity.status(403).build();
        }
        vaccinService.deleteVaccinPhysique(Long.parseLong(request.get("id")));
        return ResponseEntity.ok().build();
    }
}