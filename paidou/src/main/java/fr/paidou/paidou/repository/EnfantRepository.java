package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.Enfant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnfantRepository extends JpaRepository<Enfant, Long> {
    List<Enfant> findByPrenom(String prenom); 
    List<Enfant> findByNom(String nom);    
    List<Enfant> findByDateDeNaissanceBefore(LocalDate date);
    List<Enfant> findByDateDeNaissanceAfter(LocalDate date);      
    List<Enfant> findByEstParti(boolean estParti);    
    List<Enfant> findByCrecheNom(String nomCreche);
}