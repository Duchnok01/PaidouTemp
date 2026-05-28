package fr.paidou.paidou.controller;

import fr.paidou.paidou.model.*;
import fr.paidou.paidou.repository.*;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/logs")
public class LogController {

    private final LogRepository logRepository;
    private final SecurityUtils securityUtils;
    private final UserService userService;
    private final CrecheService crecheService;
    private final EnfantService enfantService;
    private final VaccinService vaccinService;
    private final EnregistrementVaccinationService enregistrementService;
    private final LogService logService;
    private final UserRepository userRepository;
    private final CrecheRepository crecheRepository;
    private final EnfantRepository enfantRepository;
    private final VaccinRepository vaccinRepository;

    public LogController(LogRepository logRepository, SecurityUtils securityUtils,
                         UserService userService, CrecheService crecheService,
                         EnfantService enfantService, VaccinService vaccinService,
                         EnregistrementVaccinationService enregistrementService,
                         LogService logService, UserRepository userRepository,
                         CrecheRepository crecheRepository, EnfantRepository enfantRepository,
                         VaccinRepository vaccinRepository) {
        this.logRepository = logRepository;
        this.securityUtils = securityUtils;
        this.userService = userService;
        this.crecheService = crecheService;
        this.enfantService = enfantService;
        this.vaccinService = vaccinService;
        this.enregistrementService = enregistrementService;
        this.logService = logService;
        this.userRepository = userRepository;
        this.crecheRepository = crecheRepository;
        this.enfantRepository = enfantRepository;
        this.vaccinRepository = vaccinRepository;
    }

    @GetMapping
    public ResponseEntity<List<LogDTO>> getLogs(Authentication authentication,
                                                @RequestParam(required = false) String q) {
        User currentUser = securityUtils.getCurrentUser();
        List<Log> logs;

        if (securityUtils.isAdmin()) {
            logs = logRepository.findAllByOrderByTimestampDesc();
        } else {
            List<Log> ownLogs = logRepository.findByUserIdOrderByTimestampDesc(currentUser.getId());
            List<String> crecheNoms = crecheRepository.findByDirecteurId(currentUser.getId())
                    .stream().map(Creche::getNom).toList();
            List<Log> crecheLogs = logRepository.findByCrecheNomInOrderByTimestampDesc(crecheNoms);
            logs = mergeAndSort(ownLogs, crecheLogs);
        }

        if (q != null && !q.isBlank()) {
            logs = filterLogs(logs, q);
        }

        List<LogDTO> dtos = logs.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/undo")
    public ResponseEntity<String> undoAction(@RequestBody Long logId) {
        User currentUser = securityUtils.getCurrentUser();
        Log log = logRepository.findById(logId).orElse(null);
        if (log == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Log introuvable");
        }

        if (!securityUtils.isAdmin()) {
            boolean isAuthor = log.getUserId().equals(currentUser.getId());
            boolean isOwnCreche = log.getCrecheNom() != null &&
                    crecheRepository.findById(log.getCrecheNom())
                            .map(c -> c.getDirecteur().getId().equals(currentUser.getId()))
                            .orElse(false);
            if (!isAuthor && !isOwnCreche) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Action non autorisée");
            }
            if (!isUndoableByDirectrice(log.getAction())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cette action n'est pas annulable par une directrice");
            }
        }

        try {
            String resultMessage = performUndo(log);
            // Log de l'undo
            Creche creche = null;
            if (log.getCrecheNom() != null) {
                creche = crecheRepository.findById(log.getCrecheNom()).orElse(null);
            }
            Enfant enfant = null;
            if (log.getEnfantId() != null) {
                enfant = enfantRepository.findById(log.getEnfantId()).orElse(null);
            }
            Vaccin vaccin = null;
            if (log.getVaccinId() != null) {
                vaccin = vaccinRepository.findById(log.getVaccinId()).orElse(null);
            }
            logService.log("UNDO_" + log.getAction(), currentUser, creche, enfant, vaccin,
                    "logId=" + log.getId() + ", details=" + log.getDetails());
            return ResponseEntity.ok(resultMessage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    private boolean isUndoableByDirectrice(String action) {
        return switch (action) {
            case "DESACTIVER_ENFANT", "AJOUTER_ENREGISTREMENT" -> true;
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
                enfantService.reactiverEnfant(log.getEnfantId());
                return "Enfant réactivé.";
            case "FERMER_CRECHE":
                crecheService.rouvrirCreche(log.getCrecheNom());
                return "Crèche rouverte.";
            case "RENDRE_OBSOLETE_VACCIN":
                vaccinService.reactiverVaccin(log.getVaccinId());
                return "Vaccin réactivé.";
            case "CHANGER_DIRECTEUR":
                String[] parts = log.getDetails().split(" -> ");
                String ancienDirecteur = parts[0].trim();
                crecheService.changeDirecteur(log.getCrecheNom(), ancienDirecteur);
                return "Directeur rétabli.";
            case "RECTIFIER_ENFANT":
                restoreEnfantInfos(log);
                return "Informations de l'enfant rétablies.";
            case "TRANSFERER_ENFANT":
                String detail = log.getDetails();
                String crecheOrigine = detail.substring(3, detail.indexOf(" vers ")).trim();
                enfantService.changeCreche(log.getEnfantId(), crecheOrigine);
                return "Enfant remis dans sa crèche d'origine.";
            case "TRANSFERER_TOUS_ENFANTS":
                String[] partsTransfert = log.getDetails().split(" -> ");
                String from = partsTransfert[1].trim();
                String to = partsTransfert[0].trim();
                enfantService.transferAllEnfants(from, to);
                return "Transfert annulé.";
            case "CREER_VACCIN":
                vaccinService.deleteVaccinPhysique(log.getVaccinId());
                return "Vaccin supprimé.";
            case "MODIFIER_VACCIN":
                restoreVaccinInfos(log);
                return "Vaccin rétabli.";
            case "AJOUTER_ENREGISTREMENT":
                String dateStr = log.getDetails().replace("date=", "").split(",")[0].trim();
                LocalDate date = LocalDate.parse(dateStr);
                enregistrementService.deleteEnregistrement(
                        log.getEnfantId(),
                        log.getVaccinId(),
                        date
                );
                return "Enregistrement supprimé.";
            default:
                throw new IllegalArgumentException("Action non annulable : " + action);
        }
    }

    private void restoreEnfantInfos(Log log) {
        String details = log.getDetails();
        String ancienNom = extractValue(details, "ancienNom");
        String ancienPrenom = extractValue(details, "ancienPrenom");
        LocalDate ancienneDate = LocalDate.parse(extractValue(details, "ancienneDate"));
        enfantService.rectifierInfos(log.getEnfantId(), ancienNom, ancienPrenom, ancienneDate);
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
        vaccinService.editVaccin(log.getVaccinId(), ancienNom, ancienMaladies,
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

    private List<Log> mergeAndSort(List<Log> list1, List<Log> list2) {
        Map<Long, Log> map = new LinkedHashMap<>();
        list1.forEach(l -> map.put(l.getId(), l));
        list2.forEach(l -> map.putIfAbsent(l.getId(), l));
        List<Log> merged = new ArrayList<>(map.values());
        merged.sort(Comparator.comparing(Log::getTimestamp).reversed());
        return merged;
    }

    private List<Log> filterLogs(List<Log> logs, String q) {
        String lower = q.toLowerCase();
        return logs.stream().filter(l -> 
            (l.getAction() != null && l.getAction().toLowerCase().contains(lower)) ||
            (l.getDetails() != null && l.getDetails().toLowerCase().contains(lower)) ||
            (l.getCrecheNom() != null && l.getCrecheNom().toLowerCase().contains(lower)) ||
            (userRepository.findById(l.getUserId()).map(User::getPrenom).orElse("").toLowerCase().contains(lower))
        ).collect(Collectors.toList());
    }

    private LogDTO toDto(Log log) {
        String userPrenom = null;
        if (log.getUserId() != null) {
            userPrenom = userRepository.findById(log.getUserId()).map(User::getPrenom).orElse("?");
        }
        String enfantPrenom = null, enfantNom = null;
        if (log.getEnfantId() != null) {
            Enfant e = enfantRepository.findById(log.getEnfantId()).orElse(null);
            if (e != null) {
                enfantPrenom = e.getPrenom();
                enfantNom = e.getNom();
            }
        }
        String vaccinNom = null;
        if (log.getVaccinId() != null) {
            vaccinNom = vaccinRepository.findById(log.getVaccinId()).map(Vaccin::getNom).orElse(null);
        }
        return new LogDTO(log.getId(), log.getAction(), userPrenom, log.getCrecheNom(),
                enfantPrenom, enfantNom, vaccinNom, log.getTimestamp(), log.getDetails());
    }

    public record LogDTO(
        Long id,
        String action,
        String userPrenom,
        String crecheNom,
        String enfantPrenom,
        String enfantNom,
        String vaccinNom,
        LocalDateTime timestamp,
        String details
    ) {}
}