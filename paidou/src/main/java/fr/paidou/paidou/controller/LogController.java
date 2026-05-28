package fr.paidou.paidou.controller;

import fr.paidou.paidou.model.Log;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.LogRepository;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.CrecheService;
import fr.paidou.paidou.service.EnfantService;
import fr.paidou.paidou.service.UserService;
import fr.paidou.paidou.service.VaccinService;
import fr.paidou.paidou.service.EnregistrementVaccinationService;
import fr.paidou.paidou.service.LogService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
    private final EnregistrementVaccinationService enregistrementService;
    private final LogService logService;

    public LogController(LogRepository logRepository, SecurityUtils securityUtils,
                         UserService userService, CrecheService crecheService,
                         EnfantService enfantService, VaccinService vaccinService,
                         EnregistrementVaccinationService enregistrementService,
                         LogService logService) {
        this.logRepository = logRepository;
        this.securityUtils = securityUtils;
        this.userService = userService;
        this.crecheService = crecheService;
        this.enfantService = enfantService;
        this.vaccinService = vaccinService;
        this.enregistrementService = enregistrementService;
        this.logService = logService;
    }

    @GetMapping
    public ResponseEntity<List<Log>> getLogs(Authentication authentication) {
        User currentUser = securityUtils.getCurrentUser();
        if (securityUtils.isAdmin()) {
            return ResponseEntity.ok(logRepository.findAll());
        } else {
            List<Log> logs = logRepository.findByUserOrCrecheDirecteur(
                    currentUser.getPrenom(),
                    currentUser.getId()
            );
            return ResponseEntity.ok(logs);
        }
    }

    @PostMapping("/undo")
    public ResponseEntity<String> undoAction(@RequestBody Long logId) {
        User currentUser = securityUtils.getCurrentUser();
        Log log = logRepository.findById(logId).orElse(null);
        if (log == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Log introuvable");
        }

        // Vérification des droits : admin peut tout undo.
        // Une directrice peut undo si elle est l'auteur du log ET le log concerne une de ses crèches,
        // ou si le log concerne une de ses crèches même si fait par quelqu'un d'autre (à définir).
        // On applique la règle : l'utilisateur doit avoir le droit d'effectuer l'action inverse.
        if (!securityUtils.isAdmin()) {
            // Pour une directrice, on vérifie que le log est lié à une crèche qu'elle dirige,
            // ou que c'est son propre log sur une action qu'elle a le droit d'annuler.
            if (log.getCreche() == null || 
                !log.getCreche().getDirecteur().getId().equals(currentUser.getId())) {
                // Si pas lié à une de ses crèches, on vérifie si c'est son propre log
                if (log.getUser() == null || !log.getUser().getId().equals(currentUser.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous n'avez pas le droit d'annuler cette action");
                }
                // Même si c'est son propre log, l'action doit être annulable pour une directrice.
                // On définit une liste d'actions undoables par la directrice.
                if (!isUndoableByDirectrice(log.getAction())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cette action n'est pas annulable par une directrice");
                }
            }
        }

        try {
            String resultMessage = performUndo(log);
            // Logger l'undo
            logService.log("UNDO_" + log.getAction(), currentUser,
                    log.getCreche(), log.getEnfant(), log.getVaccin(),
                    "logId=" + log.getId() + ", details=" + log.getDetails());
            return ResponseEntity.ok(resultMessage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    private boolean isUndoableByDirectrice(String action) {
        // Liste des actions que la directrice peut annuler elle-même
        return switch (action) {
            case "DESACTIVER_ENFANT",
                 "AJOUTER_ENREGISTREMENT" -> true;
            default -> false;
        };
    }

    private String performUndo(Log log) {
        String action = log.getAction();
        switch (action) {
            case "DESACTIVER_USER":
                userService.reactiverUser(log.getDetails().replace("prenom=", ""));
                return "Utilisateur réactivé.";
            case "DESACTIVER_ENFANT":
                enfantService.reactiverEnfant(log.getEnfant().getId_enfant());
                return "Enfant réactivé.";
            case "FERMER_CRECHE":
                crecheService.rouvrirCreche(log.getDetails().replace("nom=", ""));
                return "Crèche rouverte.";
            case "RENDRE_OBSOLETE_VACCIN":
                vaccinService.reactiverVaccin(log.getVaccin().getId());
                return "Vaccin réactivé.";
            case "CHANGER_DIRECTEUR":
                // Détails stockés sous la forme "ancien -> nouveau"
                String[] parts = log.getDetails().split(" -> ");
                String ancienDirecteur = parts[0].trim();
                crecheService.changeDirecteur(log.getCreche().getNom(), ancienDirecteur);
                return "Directeur rétabli.";
            case "RECTIFIER_ENFANT":
                // Restaurer les anciennes valeurs stockées dans le détail
                restoreEnfantInfos(log);
                return "Informations de l'enfant rétablies.";
            case "TRANSFERER_ENFANT":
                // Détails : "de CrecheA vers CrecheB, enfant=..."
                String detail = log.getDetails();
                String crecheOrigine = detail.substring(3, detail.indexOf(" vers ")).trim();
                enfantService.changeCreche(log.getEnfant().getId_enfant(), crecheOrigine);
                return "Enfant remis dans sa crèche d'origine.";
            case "TRANSFERER_TOUS_ENFANTS":
                // Détails : "from -> to"
                String[] partsTransfert = log.getDetails().split(" -> ");
                String from = partsTransfert[1].trim();
                String to = partsTransfert[0].trim();
                enfantService.transferAllEnfants(from, to);
                return "Transfert annulé.";
            case "CREER_VACCIN":
                // undo = suppression du vaccin créé
                vaccinService.deleteVaccinPhysique(log.getVaccin().getId());
                return "Vaccin supprimé.";
            case "MODIFIER_VACCIN":
                // Restaurer les anciennes valeurs
                restoreVaccinInfos(log);
                return "Vaccin rétabli.";
            case "AJOUTER_ENREGISTREMENT":
                // undo = suppression de l'enregistrement créé
                enregistrementService.deleteEnregistrement(
                        log.getEnfant().getId_enfant(),
                        log.getVaccin().getId(),
                        LocalDate.parse(log.getDetails().replace("date=", "").split(",")[0].trim())
                );
                return "Enregistrement supprimé.";
            default:
                throw new IllegalArgumentException("Action non annulable : " + action);
        }
    }

    private void restoreEnfantInfos(Log log) {
        // Détails format : "ancienNom=X, ancienPrenom=Y, ancienneDate=Z, nouveauNom=..., ..."
        String details = log.getDetails();
        String ancienNom = extractValue(details, "ancienNom");
        String ancienPrenom = extractValue(details, "ancienPrenom");
        LocalDate ancienneDate = LocalDate.parse(extractValue(details, "ancienneDate"));
        enfantService.rectifierInfos(log.getEnfant().getId_enfant(), ancienNom, ancienPrenom, ancienneDate);
    }

    private void restoreVaccinInfos(Log log) {
        String details = log.getDetails();
        String ancienNom = extractValue(details, "ancienNom");
        String ancienMaladies = extractValue(details, "ancienMaladies");
        Integer ancienAvant = parseIntegerOrNull(extractValue(details, "ancienAvant"));
        Integer ancienApres = parseIntegerOrNull(extractValue(details, "ancienApres"));
        Integer ancienAge = Integer.parseInt(extractValue(details, "ancienAge"));
        Integer ancienDelai1 = Integer.parseInt(extractValue(details, "ancienDelai1"));
        Integer ancienDelai2 = parseIntegerOrNull(extractValue(details, "ancienDelai2"));
        vaccinService.editVaccin(log.getVaccin().getId(), ancienNom, ancienMaladies,
                ancienAvant, ancienApres, ancienAge, ancienDelai1, ancienDelai2);
    }

    private String extractValue(String details, String key) {
        String[] parts = details.split(", ");
        for (String part : parts) {
            if (part.startsWith(key + "=")) {
                return part.substring((key + "=").length());
            }
        }
        throw new IllegalArgumentException("Clé " + key + " introuvable dans " + details);
    }

    private Integer parseIntegerOrNull(String value) {
        if (value == null || value.equals("null")) return null;
        return Integer.parseInt(value);
    }
}