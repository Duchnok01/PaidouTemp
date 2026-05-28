package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LogRepository extends JpaRepository<Log, Long> {

    List<Log> findAllByOrderByTimestampDesc();

    List<Log> findByUserIdOrderByTimestampDesc(Long userId);

    List<Log> findByCrecheNomInOrderByTimestampDesc(List<String> crecheNoms);

    List<Log> findByCrecheNom(String nomCreche);

    List<Log> findByEnfantId(Long enfantId);
}