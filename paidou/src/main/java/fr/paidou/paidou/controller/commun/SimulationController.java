package fr.paidou.paidou.controller.commun;

import fr.paidou.paidou.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/simulation")
public class SimulationController {

    private final SecurityUtils securityUtils;

    public SimulationController(SecurityUtils securityUtils) {
        this.securityUtils = securityUtils;
    }

    @PostMapping("/start")
    public ResponseEntity<String> startSimulation(@RequestBody Map<String, String> request) {
        String targetRole = request.get("role");
        if (!securityUtils.canSimulate(securityUtils.getCurrentUser().getRole(), targetRole)) {
            return ResponseEntity.status(403).body("Rôle non autorisé");
        }
        securityUtils.setSimulatedRole(targetRole);
        return ResponseEntity.ok("Simulation démarrée en tant que " + targetRole);
    }

    @PostMapping("/stop")
    public ResponseEntity<Void> stopSimulation() {
        securityUtils.stopSimulation();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> getStatus() {
        String simulated = securityUtils.getSimulatedRole();
        String real = securityUtils.getCurrentUser().getRole();
        return ResponseEntity.ok(Map.of("realRole", real, "simulatedRole", simulated != null ? simulated : real));
    }
}