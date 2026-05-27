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
    public void undoAction(@RequestBody Long logId) {
        // Logique pour annuler l'action basée sur logId
        // Assurez-vous de ne pas permettre l'annulation de la suppression d'un enfant
    }
}
