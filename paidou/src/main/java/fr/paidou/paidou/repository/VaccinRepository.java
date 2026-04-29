package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.Vaccin;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VaccinRepository extends JpaRepository<Vaccin, Long> {

    Optional<Vaccin> findByNom(String nom);

    List<Vaccin> findByNomContainingIgnoreCase(String nom);

    List<Vaccin> findByAgePremiereVaccinationLessThanEqual(Integer ageEnMois);

    List<Vaccin> findByPourEnfantsNesAvant(Integer annee);

    List<Vaccin> findByPourEnfantsNesApres(Integer annee);

}