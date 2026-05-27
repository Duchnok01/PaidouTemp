package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogRepository extends JpaRepository<Log, Long> {
}
