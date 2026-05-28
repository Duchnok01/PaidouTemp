package fr.paidou.paidou.service;

import fr.paidou.paidou.model.*;
import fr.paidou.paidou.repository.LogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class LogService {

    private final LogRepository logRepository;

    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    /**
     * Log complet avec toutes les entités liées.
     */
    public void log(String action, User user, Creche creche, Enfant enfant, Vaccin vaccin, String details) {
        Log log = new Log();
        log.setAction(action);
        log.setUser(user);
        log.setCreche(creche);
        log.setEnfant(enfant);
        log.setVaccin(vaccin);
        log.setTimestamp(LocalDateTime.now());
        log.setDetails(details != null ? details : "");
        logRepository.save(log);
    }

    /**
     * Log pour une action liée à un utilisateur uniquement (pas de crèche/enfant/vaccin).
     */
    public void log(String action, User user, String details) {
        log(action, user, null, null, null, details);
    }

    /**
     * Log pour une action liée à un utilisateur et une crèche.
     */
    public void log(String action, User user, Creche creche, String details) {
        log(action, user, creche, null, null, details);
    }

    /**
     * Log pour une action liée à un utilisateur, une crèche et un enfant.
     */
    public void log(String action, User user, Creche creche, Enfant enfant, String details) {
        log(action, user, creche, enfant, null, details);
    }

    /**
     * Log pour une action liée à un utilisateur et un vaccin.
     */
    public void log(String action, User user, Vaccin vaccin, String details) {
        log(action, user, null, null, vaccin, details);
    }
}