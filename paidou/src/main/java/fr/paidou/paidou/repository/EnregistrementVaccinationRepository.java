package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.model.EnregistrementVaccinationId;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnregistrementVaccinationRepository extends JpaRepository<EnregistrementVaccination, EnregistrementVaccinationId> {

    List<EnregistrementVaccination> findByIdIdEnfant(Long idEnfant);

    List<EnregistrementVaccination> findByIdIdVaccin(Long idVaccin);

    List<EnregistrementVaccination> findByIdDateVaccinationBefore(LocalDate dateVaccination);

    List<EnregistrementVaccination> findByIdDateVaccinationAfter(LocalDate dateVaccination);

    List<EnregistrementVaccination> findByCrecheNom(String nomCreche);

    List<EnregistrementVaccination> findByUserId(Long idUser);
}