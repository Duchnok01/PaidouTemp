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

    // Méthode complète avec toutes les valeurs
    public void log(String action, Long userId, String crecheNom, Long enfantId, Long vaccinId, String details) {
        Log log = new Log();
        log.setAction(action);
        log.setUserId(userId);
        log.setCrecheNom(crecheNom);
        log.setEnfantId(enfantId);
        log.setVaccinId(vaccinId);
        log.setTimestamp(LocalDateTime.now());
        log.setDetails(details != null ? details : "");
        logRepository.save(log);
    }

    // Surcharge : utilisateur uniquement
    public void log(String action, User user, String details) {
        log(action, user.getId(), null, null, null, details);
    }

    // Surcharge : utilisateur + crèche
    public void log(String action, User user, Creche creche, String details) {
        log(action, user.getId(), creche != null ? creche.getNom() : null, null, null, details);
    }

    // Surcharge : utilisateur + crèche + enfant
    public void log(String action, User user, Creche creche, Enfant enfant, String details) {
        log(action, user.getId(), creche != null ? creche.getNom() : null,
                enfant != null ? enfant.getId_enfant() : null, null, details);
    }

    // Surcharge : utilisateur + vaccin
    public void log(String action, User user, Vaccin vaccin, String details) {
        log(action, user.getId(), null, null, vaccin != null ? vaccin.getId() : null, details);
    }

    // Surcharge : utilisateur + crèche + enfant + vaccin (enregistrement)
    public void log(String action, User user, Creche creche, Enfant enfant, Vaccin vaccin, String details) {
        log(action, user.getId(), creche != null ? creche.getNom() : null,
                enfant != null ? enfant.getId_enfant() : null,
                vaccin != null ? vaccin.getId() : null, details);
    }
}