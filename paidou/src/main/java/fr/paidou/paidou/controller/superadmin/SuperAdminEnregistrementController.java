package fr.paidou.paidou.controller.superadmin;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.EnregistrementVaccinationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/superadmin/enregistrements")
public class SuperAdminEnregistrementController {

    private final EnregistrementVaccinationService enregistrementService;
    private final SecurityUtils securityUtils;

    public SuperAdminEnregistrementController(EnregistrementVaccinationService enregistrementService,
                                               SecurityUtils securityUtils) {
        this.enregistrementService = enregistrementService;
        this.securityUtils = securityUtils;
    }

    // DELETE supprimer un enregistrement
    @DeleteMapping
    public ResponseEntity<Void> deleteEnregistrement(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("SUPPRIMER_ENREGISTREMENT")) {
            return ResponseEntity.status(403).build();
        }
        enregistrementService.deleteEnregistrement(
            Long.parseLong(request.get("idEnfant")),
            Long.parseLong(request.get("idVaccin")),
            LocalDate.parse(request.get("dateVaccination"))
        );
        return ResponseEntity.ok().build();
    }
}