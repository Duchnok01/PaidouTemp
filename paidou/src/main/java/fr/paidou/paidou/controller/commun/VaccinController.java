package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.VaccinService;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/vaccins")
public class VaccinController {

    private final VaccinService vaccinService;
    private final SecurityUtils securityUtils;

    public VaccinController(VaccinService vaccinService, SecurityUtils securityUtils) {
        this.vaccinService = vaccinService;
        this.securityUtils = securityUtils;
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
                        v.getNeAvantLe(), v.getNeApresLe(),
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

    public record VaccinSummaryDTO(
        Long id,
        String nom,
        String maladiesPrevenues,
        LocalDate neAvantLe,
        LocalDate neApresLe,
        Integer agePremiereVaccination,
        Integer nbMoisPremierDelai,
        Integer nbMoisDeuxiemeDelai,
        boolean estObsolete
    ) {}

    public record VaccinPourEnfantDTO(Long id, String nom, long dosesRecues, int dosesRequises, boolean complet) {}
}
