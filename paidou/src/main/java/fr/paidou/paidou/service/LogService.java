package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Log;
import fr.paidou.paidou.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class LogService {

    @Autowired
    private LogRepository logRepository;

    public void log(String action, String user, String details) {
        Log log = new Log();
        log.setAction(action);
        log.setUser(user);
        log.setTimestamp(LocalDateTime.now());
        log.setDetails(details);
        logRepository.save(log);
    }
}
