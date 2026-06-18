package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.model.Log;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.repository.LogRepository;
import fr.paidou.paidou.repository.UserRepository;
import fr.paidou.paidou.repository.VaccinRepository;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.CrecheService;
import fr.paidou.paidou.service.EnfantService;
import fr.paidou.paidou.service.EnregistrementVaccinationService;
import fr.paidou.paidou.service.LogService;
import fr.paidou.paidou.service.UserService;
import fr.paidou.paidou.service.VaccinService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/logs")
public class LogController {

    private static final Set<String> UNDOABLE_ACTIONS = Set.of(
            "DESACTIVER_USER", "DESACTIVER_ENFANT", "FERMER_CRECHE",
            "RENDRE_OBSOLETE_VACCIN", "CHANGER_DIRECTEUR", "RECTIFIER_ENFANT",
            "TRANSFERER_ENFANT", "TRANSFERER_TOUS_ENFANTS", "CREER_VACCIN",
            "MODIFIER_VACCIN", "AJOUTER_ENREGISTREMENT"
    );

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
    public ResponseEntity<List<LogDTO>> getLogs(@RequestParam(required = false) String q) {
        User currentUser = securityUtils.getCurrentUser();
        Set<Long> undoneLogIds = undoneLogIds();
        List<LogDTO> dtos = visibleLogsFor(currentUser).stream()
                .map(log -> toDto(log, currentUser, undoneLogIds))
                .toList();

        if (q != null && !q.isBlank()) {
            String lower = q.toLowerCase();
            dtos = dtos.stream().filter(dto ->
                contains(dto.action(), lower) ||
                contains(dto.details(), lower) ||
                contains(dto.crecheNom(), lower) ||
                contains(dto.userPrenom(), lower) ||
                contains(dto.enfantPrenom(), lower) ||
                contains(dto.enfantNom(), lower) ||
                contains(dto.vaccinNom(), lower)
            ).collect(Collectors.toList());
        }

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/undo")
    public ResponseEntity<String> undoAction(@RequestBody Long logId) {
        User currentUser = securityUtils.getCurrentUser();
        Log log = logRepository.findById(logId).orElse(null);
        if (log == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Log introuvable");
        }
        if (!canUndo(currentUser, log)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Action non autorisee");
        }

        try {
            String resultMessage = performUndo(log);
            User realUser = securityUtils.getRealUserIfSimulating();
            User logUser = realUser != null ? realUser : currentUser;
            Creche creche = log.getCrecheNom() != null
                    ? crecheRepository.findById(log.getCrecheNom()).orElse(null)
                    : null;
            Enfant enfant = log.getEnfantId() != null
                    ? enfantRepository.findById(log.getEnfantId()).orElse(null)
                    : null;
            Vaccin vaccin = log.getVaccinId() != null
                    ? vaccinRepository.findById(log.getVaccinId()).orElse(null)
                    : null;
            logService.log("UNDO_" + log.getAction(), logUser, creche, enfant, vaccin,
                    "logId=" + log.getId() + ", details=" + log.getDetails());
            return ResponseEntity.ok(resultMessage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    private List<Log> visibleLogsFor(User currentUser) {
        if (currentUser.getRole().equals("superadmin") || currentUser.getRole().equals("pdg")) {
            return logRepository.findAllByOrderByTimestampDesc();
        }
        Set<Long> visibleUserIds = scopedUserIds(currentUser);
        Set<String> visibleCreches = scopedCrecheNames(currentUser, visibleUserIds);
        return logRepository.findAllByOrderByTimestampDesc().stream()
                .filter(log ->
                        (log.getUserId() != null && visibleUserIds.contains(log.getUserId()))
                        || (log.getCrecheNom() != null && visibleCreches.contains(log.getCrecheNom())))
                .toList();
    }

    private Set<Long> scopedUserIds(User currentUser) {
        Set<Long> ids = new HashSet<>();
        ids.add(currentUser.getId());
        if (currentUser.getRole().equals("coordinateur")) {
            userRepository.findByCoordinateurId(currentUser.getId()).stream()
                    .filter(user -> user.getRole().equals("directrice"))
                    .map(User::getId)
                    .forEach(ids::add);
        }
        return ids;
    }

    private Set<String> scopedCrecheNames(User currentUser, Set<Long> scopedUserIds) {
        Set<String> crecheNames = new HashSet<>();
        for (Long userId : scopedUserIds) {
            crecheRepository.findByDirecteurId(userId).stream()
                    .map(Creche::getNom)
                    .forEach(crecheNames::add);
        }
        return crecheNames;
    }

    private boolean canUndo(User currentUser, Log log) {
        return isUndoableAction(log.getAction()) && !hasUndoLog(log) && canActOnLogUser(currentUser, log);
    }

    private boolean canUndo(User currentUser, Log log, Set<Long> undoneLogIds) {
        return isUndoableAction(log.getAction()) && !undoneLogIds.contains(log.getId()) && canActOnLogUser(currentUser, log);
    }

    private boolean isUndoableAction(String action) {
        return action != null
                && !action.startsWith("UNDO_")
                && !action.startsWith("REACTIVER_")
                && UNDOABLE_ACTIONS.contains(action);
    }

    private boolean canActOnLogUser(User currentUser, Log log) {
        if (currentUser.getRole().equals("superadmin")) return true;
        if (log.getUserId() == null) return false;
        if (log.getUserId().equals(currentUser.getId())) return true;

        User logUser = userRepository.findById(log.getUserId()).orElse(null);
        if (logUser == null) return false;

        if (currentUser.getRole().equals("coordinateur")) {
            return logUser.getRole().equals("directrice")
                    && logUser.getCoordinateur() != null
                    && logUser.getCoordinateur().getId().equals(currentUser.getId());
        }
        if (currentUser.getRole().equals("pdg")) {
            return logUser.getRole().equals("coordinateur") || logUser.getRole().equals("directrice");
        }
        return false;
    }

    private String undoUnavailableReason(User currentUser, Log log) {
        if (log.getAction() != null && log.getAction().startsWith("UNDO_")) return "Action deja annulee.";
        if (hasUndoLog(log)) return "Action deja annulee.";
        if (log.getAction() != null && log.getAction().startsWith("REACTIVER_")) return "Action de restauration non annulable.";
        if (!canActOnLogUser(currentUser, log)) return "Vous ne pouvez pas annuler les actions de cet utilisateur.";
        if (!isUndoableAction(log.getAction())) return "Action non annulable automatiquement.";
        return null;
    }

    private String undoUnavailableReason(User currentUser, Log log, Set<Long> undoneLogIds) {
        if (log.getAction() != null && log.getAction().startsWith("UNDO_")) return "Action deja annulee.";
        if (undoneLogIds.contains(log.getId())) return "Action deja annulee.";
        if (log.getAction() != null && log.getAction().startsWith("REACTIVER_")) return "Action de restauration non annulable.";
        if (!canActOnLogUser(currentUser, log)) return "Vous ne pouvez pas annuler les actions de cet utilisateur.";
        if (!isUndoableAction(log.getAction())) return "Action non annulable automatiquement.";
        return null;
    }

    private String undoAlternativePath(User currentUser, Log log) {
        if (log.getAction() == null) return null;
        if (log.getAction().equals("SUPPRIMER_USER") || log.getAction().equals("CREER_USER")) {
            if (currentUser.getRole().equals("superadmin")) return "/superadmin/users";
            if (currentUser.getRole().equals("pdg")) return "/pdg/users";
        }
        if (log.getAction().equals("SUPPRIMER_ENFANT")) {
            if (currentUser.getRole().equals("superadmin")) return "/superadmin/enfants";
            if (currentUser.getRole().equals("pdg")) return "/pdg/enfants";
        }
        return null;
    }

    private String undoAlternativeLabel(Log log) {
        if (log.getAction() == null) return null;
        if (log.getAction().equals("SUPPRIMER_USER") || log.getAction().equals("CREER_USER")) {
            return "Ouvrir la gestion des utilisateurs";
        }
        if (log.getAction().equals("SUPPRIMER_ENFANT")) {
            return "Ouvrir la gestion des enfants";
        }
        return null;
    }

    private boolean hasUndoLog(Log log) {
        return logRepository.findAllByOrderByTimestampDesc().stream()
                .anyMatch(candidate -> candidate.getAction().equals("UNDO_" + log.getAction())
                        && candidate.getDetails() != null
                        && candidate.getDetails().contains("logId=" + log.getId()));
    }

    private Set<Long> undoneLogIds() {
        return logRepository.findAllByOrderByTimestampDesc().stream()
                .filter(candidate -> candidate.getAction() != null && candidate.getAction().startsWith("UNDO_"))
                .map(candidate -> extractLongValueOrNull(candidate.getDetails(), "logId"))
                .filter(id -> id != null)
                .collect(Collectors.toSet());
    }

    private String performUndo(Log log) {
        String action = log.getAction();
        switch (action) {
            case "DESACTIVER_USER":
                userService.reactiverUser(log.getDetails().replace("prenom=", ""));
                return "Utilisateur reactive.";
            case "DESACTIVER_ENFANT":
                enfantService.reactiverEnfant(log.getEnfantId());
                return "Enfant reactive.";
            case "FERMER_CRECHE":
                crecheService.rouvrirCreche(log.getCrecheNom());
                return "Creche rouverte.";
            case "RENDRE_OBSOLETE_VACCIN":
                vaccinService.reactiverVaccin(log.getVaccinId());
                return "Vaccin reactive.";
            case "CHANGER_DIRECTEUR":
                String[] parts = log.getDetails().split(" -> ");
                String ancienDirecteur = parts.length > 0 ? parts[0].trim() : "";
                crecheService.changeDirecteur(log.getCrecheNom(), ancienDirecteur);
                return "Directeur retabli.";
            case "RECTIFIER_ENFANT":
                restoreEnfantInfos(log);
                return "Informations de l'enfant retablies.";
            case "TRANSFERER_ENFANT":
                String detail = log.getDetails();
                String crecheOrigine = detail.substring(3, detail.indexOf(" vers ")).trim();
                enfantService.changeCreche(log.getEnfantId(), crecheOrigine);
                return "Enfant remis dans sa creche d'origine.";
            case "TRANSFERER_TOUS_ENFANTS":
                String[] partsTransfert = log.getDetails().split(" -> ");
                String from = partsTransfert[1].trim();
                String to = partsTransfert[0].trim();
                enfantService.transferAllEnfants(from, to);
                return "Transfert annule.";
            case "CREER_VACCIN":
                vaccinService.deleteVaccinPhysique(log.getVaccinId());
                return "Vaccin supprime.";
            case "MODIFIER_VACCIN":
                restoreVaccinInfos(log);
                return "Vaccin retabli.";
            case "AJOUTER_ENREGISTREMENT":
                String dateStr = log.getDetails().replace("date=", "").split(",")[0].trim();
                LocalDate date = LocalDate.parse(dateStr);
                enregistrementService.deleteEnregistrement(log.getEnfantId(), log.getVaccinId(), date);
                return "Enregistrement supprime.";
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
        LocalDate ancienAvant = parseLocalDateOrNull(extractValue(details, "ancienAvant"));
        LocalDate ancienApres = parseLocalDateOrNull(extractValue(details, "ancienApres"));
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
        throw new IllegalArgumentException("Cle " + key + " introuvable dans " + details);
    }

    private Long extractLongValueOrNull(String details, String key) {
        if (details == null) return null;
        String prefix = key + "=";
        for (String part : details.split(", ")) {
            if (part.startsWith(prefix)) {
                String value = part.substring(prefix.length()).trim();
                int end = 0;
                while (end < value.length() && Character.isDigit(value.charAt(end))) {
                    end++;
                }
                if (end == 0) return null;
                return Long.parseLong(value.substring(0, end));
            }
        }
        return null;
    }

    private Integer parseIntegerOrNull(String value) {
        if (value == null || value.equals("null")) return null;
        return Integer.parseInt(value);
    }

    private LocalDate parseLocalDateOrNull(String value) {
        if (value == null || value.equals("null")) return null;
        return LocalDate.parse(value);
    }

    private LogDTO toDto(Log log, User currentUser, Set<Long> undoneLogIds) {
        String userPrenom = null;
        if (log.getUserId() != null) {
            userPrenom = userRepository.findById(log.getUserId())
                    .map(User::getPrenom)
                    .orElse("Utilisateur inconnu");
        }
        String enfantPrenom = null;
        String enfantNom = null;
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
        return new LogDTO(
                log.getId(),
                log.getAction(),
                userPrenom,
                log.getCrecheNom(),
                enfantPrenom,
                enfantNom,
                vaccinNom,
                log.getTimestamp(),
                log.getDetails(),
                canUndo(currentUser, log, undoneLogIds),
                undoUnavailableReason(currentUser, log, undoneLogIds),
                undoAlternativePath(currentUser, log),
                undoAlternativeLabel(log)
        );
    }

    private boolean contains(String value, String search) {
        return value != null && value.toLowerCase().contains(search);
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
        String details,
        boolean canUndo,
        String undoUnavailableReason,
        String undoAlternativePath,
        String undoAlternativeLabel
    ) {}
}
