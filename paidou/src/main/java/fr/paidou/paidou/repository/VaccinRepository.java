package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.Vaccin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VaccinRepository extends JpaRepository<Vaccin, Long> {

    Optional<Vaccin> findByNom(String nom);

    List<Vaccin> findByNomContainingIgnoreCase(String nom);

    List<Vaccin> findByAgePremiereVaccinationLessThanEqual(Integer ageEnMois);

    List<Vaccin> findByNeAvantLe(LocalDate date);

    List<Vaccin> findByNeApresLe(LocalDate date);
}