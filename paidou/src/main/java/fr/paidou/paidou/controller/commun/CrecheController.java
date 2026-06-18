package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.CrecheService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/creches")
public class CrecheController {

    private final CrecheService crecheService;
    private final SecurityUtils securityUtils;

    public CrecheController(CrecheService crecheService, SecurityUtils securityUtils) {
        this.crecheService = crecheService;
        this.securityUtils = securityUtils;
    }

    // ==================== GET ====================

    @GetMapping
    public ResponseEntity<List<CrecheSummaryDTO>> getAllCreches() {
        if (!securityUtils.hasPermission("VOIR_TOUTES_CRECHES")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(crecheService.getAllCrechesWithInfos());
    }

    @GetMapping("/mes-creches")
    public ResponseEntity<List<CrecheSummaryDTO>> getMesCreches() {
        return ResponseEntity.ok(crecheService.getMesCrechesWithInfos());
    }

    @GetMapping("/toutes")
    public ResponseEntity<List<CrecheSummaryDTO>> getToutesLesCreches() {
        if (!securityUtils.hasPermission("VOIR_TOUTES_CRECHES")
                && !securityUtils.hasPermission("CHANGER_CRECHE_ENFANT")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(crecheService.getAllCrechesWithInfos());
    }

    // ==================== DTOs ====================

    public record CrecheSummaryDTO(String nom, String directeurPrenom, boolean estFerme, long nbEnfants) {}
}
