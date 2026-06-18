package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;
import fr.paidou.paidou.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/simulation")
public class SimulationController {

    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;

    public SimulationController(SecurityUtils securityUtils, UserRepository userRepository) {
        this.securityUtils = securityUtils;
        this.userRepository = userRepository;
    }

    // Démarrer la simulation d'un utilisateur
    @PostMapping("/start/{userId}")
    public ResponseEntity<String> startSimulation(
            @PathVariable Long userId,
            @RequestParam(required = false) String asRole) {
        User realUser = securityUtils.getRealUser();
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur cible introuvable"));
        if (!securityUtils.canSimulateUser(realUser, targetUser)) {
            return ResponseEntity.status(403).body("Vous ne pouvez pas simuler cet utilisateur.");
        }
        if ("directrice".equals(asRole) && targetUser.getRole().equals("coordinateur") && targetUser.getCoordinateur() != null) {
            securityUtils.setSelfSimulationAsDirectrice(userId);
        } else {
            securityUtils.setSimulatedUserId(userId);
        }
        return ResponseEntity.ok("Simulation démarrée en tant que " + targetUser.getPrenom());
    }

    // Arrêter la simulation
    @PostMapping("/stop")
    public ResponseEntity<Void> stopSimulation() {
        securityUtils.stopSimulation();
        return ResponseEntity.ok().build();
    }

    // Statut de la simulation
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        User realUser = securityUtils.getRealUserIfSimulating();
        User effectiveUser = securityUtils.getCurrentUser();
        User scopeUser = realUser != null ? realUser : effectiveUser;
        return ResponseEntity.ok(Map.of(
            "effectiveId", effectiveUser.getId(),
            "effectivePrenom", effectiveUser.getPrenom(),
            "effectiveRole", effectiveUser.getRole(),
            "isSimulating", realUser != null,
            "realPrenom", realUser != null ? realUser.getPrenom() : effectiveUser.getPrenom(),
            "realRole", realUser != null ? realUser.getRole() : effectiveUser.getRole(),
            "hasCoordinationScope", securityUtils.hasCoordinationScope(scopeUser)
        ));
    }

    // Liste des utilisateurs simulables
    @GetMapping("/simulatable")
    public ResponseEntity<List<Map<String, Object>>> getSimulatableUsers() {
        User realUser = securityUtils.getRealUser();
        List<User> users = securityUtils.getSimulatableUsers();
        List<Map<String, Object>> result = users.stream()
                .flatMap(u -> {
                    Map<String, Object> defaultOption = Map.of(
                            "id", (Object) u.getId(),
                            "prenom", (Object) u.getPrenom(),
                            "role", (Object) u.getRole());
                    if (u.getRole().equals("coordinateur") && u.getCoordinateur() != null) {
                        Map<String, Object> directriceOption = Map.of(
                                "id", (Object) u.getId(),
                                "prenom", (Object) u.getPrenom(),
                                "role", (Object) "directrice",
                                "asRole", (Object) "directrice");
                        if (u.getId().equals(realUser.getId())) {
                            return java.util.stream.Stream.of(directriceOption);
                        }
                        return java.util.stream.Stream.of(defaultOption, directriceOption);
                    }
                    return java.util.stream.Stream.of(defaultOption);
                })
                .toList();
        return ResponseEntity.ok(result);
    }
}
