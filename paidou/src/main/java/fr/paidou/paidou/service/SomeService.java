package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Log;
import fr.paidou.paidou.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class SomeService {

    @Autowired
    private LogRepository logRepository;

    public void someAction(String user) {
        // Logique de l'action

        // Enregistrement de l'action dans les logs
        Log log = new Log();
        log.setAction("SOME_ACTION");
        log.setUser(user);
        log.setTimestamp(LocalDateTime.now());
        log.setDetails("Détails de l'action");
        logRepository.save(log);
    }
}
