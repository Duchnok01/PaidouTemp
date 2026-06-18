package fr.paidou.paidou.controller.superadmin;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.EnfantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping({"/superadmin/enfants", "/admin/enfants"})
public class SuperAdminEnfantController {

    private final EnfantService enfantService;
    private final SecurityUtils securityUtils;

    public SuperAdminEnfantController(EnfantService enfantService, SecurityUtils securityUtils) {
        this.enfantService = enfantService;
        this.securityUtils = securityUtils;
    }

    // POST créer un enfant
    @PostMapping
    public ResponseEntity<Void> createEnfant(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CREER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        enfantService.createEnfant(
            request.get("nom"),
            request.get("prenom"),
            LocalDate.parse(request.get("dateDeNaissance")),
            request.get("nomCreche")
        );
        return ResponseEntity.ok().build();
    }

    // PUT modifier infos
    @PutMapping("/rectifier")
    public ResponseEntity<Void> rectifierInfos(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("MODIFIER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        enfantService.rectifierInfos(
            Long.parseLong(request.get("id")),
            request.get("nom"),
            request.get("prenom"),
            LocalDate.parse(request.get("dateDeNaissance"))
        );
        return ResponseEntity.ok().build();
    }

    // PUT changer de crèche
    @PutMapping("/change-creche")
    public ResponseEntity<Void> changeCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CHANGER_CRECHE_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        enfantService.changeCreche(
            Long.parseLong(request.get("id")),
            request.get("nomCreche")
        );
        return ResponseEntity.ok().build();
    }

    // PUT désactiver
    @PutMapping("/disable")
    public ResponseEntity<Void> disableEnfant(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("DESACTIVER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        enfantService.disableChildAccount(Long.parseLong(request.get("id")));
        return ResponseEntity.ok().build();
    }

    // PUT réactiver
    @PutMapping("/reactiver")
    public ResponseEntity<Void> reactiverEnfant(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("REACTIVER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        enfantService.reactiverEnfant(Long.parseLong(request.get("id")));
        return ResponseEntity.ok().build();
    }

    // PUT anonymiser
    @PutMapping("/anonymiser")
    public ResponseEntity<Void> anonymiserEnfant(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("ANONYMISER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        enfantService.deleteEnfantPhysique(Long.parseLong(request.get("id")));
        return ResponseEntity.ok().build();
    }

    // DELETE supprimer définitivement (physique + enregistrements)
    @DeleteMapping("/delete-physique")
    public ResponseEntity<Void> deletePhysique(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("SUPPRIMER_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        enfantService.deleteEnfantPhysique(Long.parseLong(request.get("id")));
        return ResponseEntity.ok().build();
    }
}
