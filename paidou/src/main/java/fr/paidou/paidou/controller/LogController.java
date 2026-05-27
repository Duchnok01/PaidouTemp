package fr.paidou.paidou.controller;

import fr.paidou.paidou.model.Log;
import fr.paidou.paidou.repository.LogRepository;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.CrecheService;
import fr.paidou.paidou.service.EnfantService;
import fr.paidou.paidou.service.UserService;
import fr.paidou.paidou.service.VaccinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    private final LogRepository logRepository;
    private final SecurityUtils securityUtils;
    private final UserService userService;
    private final CrecheService crecheService;
    private final EnfantService enfantService;
    private final VaccinService vaccinService;

    @Autowired
    public LogController(LogRepository logRepository, SecurityUtils securityUtils,
                         UserService userService, CrecheService crecheService,
                         EnfantService enfantService, VaccinService vaccinService) {
        this.logRepository = logRepository;
        this.securityUtils = securityUtils;
        this.userService = userService;
        this.crecheService = crecheService;
        this.enfantService = enfantService;
        this.vaccinService = vaccinService;
    }

    @GetMapping
    public List<Log> getLogs(Authentication authentication) {
        if (securityUtils.isAdmin()) {
            return logRepository.findAll();
        } else {
            return logRepository.findByUser(authentication.getName());
        }
    }

    @PostMapping("/undo")
    public ResponseEntity<String> undoAction(@RequestBody Long logId) {
        if (!securityUtils.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Accès réservé à l'administrateur");
        }

        Log log = logRepository.findById(logId).orElse(null);
        if (log == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Log introuvable");
        }

        try {
            switch (log.getAction()) {
                case "DESACTIVER_USER":
                    userService.reactiverUser(log.getDetails());
                    break;
                case "DESACTIVER_ENFANT":
                    enfantService.reactiverEnfant(Long.parseLong(log.getDetails()));
                    break;
                case "FERMER_CRECHE":
                    crecheService.rouvrirCreche(log.getDetails());
                    break;
                case "RENDRE_OBSOLETE_VACCIN":
                    vaccinService.reactiverVaccin(Long.parseLong(log.getDetails()));
                    break;
                default:
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Action non annulable : " + log.getAction());
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }

        return ResponseEntity.ok("Action annulée : " + log.getAction());
    }
}
