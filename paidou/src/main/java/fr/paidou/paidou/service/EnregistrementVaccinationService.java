package fr.paidou.paidou.service;

import fr.paidou.paidou.model.*;
import fr.paidou.paidou.repository.*;
import fr.paidou.paidou.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class EnregistrementVaccinationService {

    private final EnregistrementVaccinationRepository enregistrementRepo;
    private final EnfantRepository enfantRepo;
    private final VaccinRepository vaccinRepo;
    private final CrecheRepository crecheRepo;
    private final UserRepository userRepo;
    private final SecurityUtils securityUtils;

    public EnregistrementVaccinationService(
            EnregistrementVaccinationRepository enregistrementRepo,
            EnfantRepository enfantRepo,
            VaccinRepository vaccinRepo,
            CrecheRepository crecheRepo,
            UserRepository userRepo,
            SecurityUtils securityUtils) {
        this.enregistrementRepo = enregistrementRepo;
        this.enfantRepo = enfantRepo;
        this.vaccinRepo = vaccinRepo;
        this.crecheRepo = crecheRepo;
        this.userRepo = userRepo;
        this.securityUtils = securityUtils;
    }

    // =========================
    // CREATE
    // =========================
    public EnregistrementVaccination createEnregistrement(
            Long idEnfant,
            Long idVaccin,
            LocalDate dateVaccination,
            String nomCreche,
            Long idUser) {

        verifierAuthorisationPourCreche(nomCreche);

        Enfant enfant = enfantRepo.findById(idEnfant)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));

        Vaccin vaccin = vaccinRepo.findById(idVaccin)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));

        Creche creche = crecheRepo.findById(nomCreche)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));

        User user = userRepo.findById(idUser)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable"));

        EnregistrementVaccinationId id = new EnregistrementVaccinationId();
        id.setIdEnfant(idEnfant);
        id.setIdVaccin(idVaccin);
        id.setDateVaccination(dateVaccination);

        EnregistrementVaccination ev = new EnregistrementVaccination();
        ev.setId(id);
        ev.setEnfant(enfant);
        ev.setVaccin(vaccin);
        ev.setCreche(creche);
        ev.setUser(user);

        return enregistrementRepo.save(ev);
    }

    // =========================
    // EDIT
    // =========================
    public EnregistrementVaccination editEnregistrement(
            Long idEnfant,
            Long idVaccin,
            LocalDate ancienneDate,
            Long newIdVaccin,
            LocalDate nouvelleDate) {

        EnregistrementVaccinationId oldId = new EnregistrementVaccinationId();
        oldId.setIdEnfant(idEnfant);
        oldId.setIdVaccin(idVaccin);
        oldId.setDateVaccination(ancienneDate);

        EnregistrementVaccination ancien = enregistrementRepo.findById(oldId)
                .orElseThrow(() -> new IllegalArgumentException("Enregistrement introuvable"));

        verifierAuthorisationPourCreche(ancien.getCreche().getNom());

        Vaccin newVaccin = vaccinRepo.findById(newIdVaccin)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));

        enregistrementRepo.delete(ancien);

        EnregistrementVaccinationId newId = new EnregistrementVaccinationId();
        newId.setIdEnfant(idEnfant);
        newId.setIdVaccin(newIdVaccin);
        newId.setDateVaccination(nouvelleDate);

        EnregistrementVaccination nouveau = new EnregistrementVaccination();
        nouveau.setId(newId);
        nouveau.setEnfant(ancien.getEnfant());
        nouveau.setVaccin(newVaccin);
        nouveau.setCreche(ancien.getCreche());
        nouveau.setUser(ancien.getUser());

        return enregistrementRepo.save(nouveau);
    }

    // =========================
    // DELETE
    // =========================
    public void deleteEnregistrement(
            Long idEnfant,
            Long idVaccin,
            LocalDate dateVaccination) {

        EnregistrementVaccinationId id = new EnregistrementVaccinationId();
        id.setIdEnfant(idEnfant);
        id.setIdVaccin(idVaccin);
        id.setDateVaccination(dateVaccination);

        EnregistrementVaccination enregistrement = enregistrementRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enregistrement introuvable"));

        verifierAuthorisationPourCreche(enregistrement.getCreche().getNom());

        enregistrementRepo.delete(enregistrement);
    }

    // =========================
    // Vérification d'autorisation par crèche
    // =========================
    private void verifierAuthorisationPourCreche(String nomCreche) {
        User current = securityUtils.getCurrentUser();
        if (!securityUtils.isAdmin()) {
            Creche creche = crecheRepo.findById(nomCreche)
                    .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
            if (!creche.getDirecteur().getId().equals(current.getId())) {
                throw new SecurityException("Vous n'êtes pas autorisé à modifier cette crèche");
            }
        }
    }
}