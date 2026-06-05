package fr.paidou.paidou.controller.superadmin;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.CrecheService;
import fr.paidou.paidou.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/superadmin/creches")
public class SuperAdminCrecheController {

    private final CrecheService crecheService;
    private final UserService userService;
    private final SecurityUtils securityUtils;

    public SuperAdminCrecheController(CrecheService crecheService, UserService userService, SecurityUtils securityUtils) {
        this.crecheService = crecheService;
        this.userService = userService;
        this.securityUtils = securityUtils;
    }

    // POST créer une crèche
    @PostMapping
    public ResponseEntity<Void> createCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CREER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        crecheService.createCreche(request.get("nom"), request.get("directeur"));
        return ResponseEntity.ok().build();
    }

    // PUT renommer
    @PutMapping("/rename")
    public ResponseEntity<Void> renameCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("RENOMMER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        crecheService.renameCreche(request.get("ancienNom"), request.get("nouveauNom"));
        return ResponseEntity.ok().build();
    }

    // PUT changer directrice
    @PutMapping("/change-directeur")
    public ResponseEntity<Void> changeDirecteur(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CHANGER_DIRECTRICE")) {
            return ResponseEntity.status(403).build();
        }
        crecheService.changeDirecteur(request.get("nom"), request.get("directeur"));
        return ResponseEntity.ok().build();
    }

    // PUT fermer
    @PutMapping("/fermer")
    public ResponseEntity<Void> fermerCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("FERMER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        crecheService.fermerCreche(request.get("nom"));
        return ResponseEntity.ok().build();
    }

    // PUT rouvrir
    @PutMapping("/rouvrir")
    public ResponseEntity<Void> rouvrirCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("ROUVRIR_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        crecheService.rouvrirCreche(request.get("nom"));
        return ResponseEntity.ok().build();
    }

    // DELETE supprimer définitivement
    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteCreche(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("SUPPRIMER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        crecheService.deleteCreche(request.get("nom"));
        return ResponseEntity.ok().build();
    }

    // PUT transférer tous les enfants d'une crèche à une autre
    @PutMapping("/transferer-enfants")
    public ResponseEntity<Void> transfererEnfants(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CHANGER_CRECHE_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        crecheService.transfererTousEnfants(request.get("from"), request.get("to"));
        return ResponseEntity.ok().build();
    }

    // PUT transférer toutes les crèches d'une directrice à une autre
    @PutMapping("/transferer-toutes")
    public ResponseEntity<Void> transfererToutes(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("TRANSFERER_CRECHES")) {
            return ResponseEntity.status(403).build();
        }
        // Appel au UserService pour transférer les crèches
        userService.transfererCreches(request.get("fromDirectrice"), request.get("toDirectrice"));
        return ResponseEntity.ok().build();
    }
}