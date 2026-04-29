package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.Creche;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrecheRepository extends JpaRepository<Creche, String> {
    List<Creche> findByDirecteurId(Long id);    
}