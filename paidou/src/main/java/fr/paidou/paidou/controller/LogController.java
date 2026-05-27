package fr.paidou.paidou.controller;

import fr.paidou.paidou.model.Log;
import fr.paidou.paidou.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    @Autowired
    private LogRepository logRepository;

    @GetMapping
    public List<Log> getLogs(Authentication authentication) {
        String role = authentication.getAuthorities().iterator().next().getAuthority();
        String username = authentication.getName();

        if ("ROLE_ADMIN".equals(role)) {
            return logRepository.findAll();
        } else {
            return logRepository.findByUser(username);
        }
    }

    @PostMapping("/undo")
    public ResponseEntity<String> undoAction(@RequestBody Long logId) {
        Log log = logRepository.findById(logId).orElse(null);
        if (log == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Log not found");
        }

        if ("DELETE_ENFANT".equals(log.getAction())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cannot undo deletion of an enfant");
        }

        // Logique pour annuler l'action basée sur logId
        // Exemple : if ("CREATE_USER".equals(log.getAction())) { ... }

        return ResponseEntity.ok("Action undone successfully");
    }
}
