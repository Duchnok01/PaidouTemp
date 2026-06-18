package fr.paidou.paidou.service;

import fr.paidou.paidou.model.*;
import fr.paidou.paidou.repository.*;
import fr.paidou.paidou.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class EnregistrementVaccinationService {

    private final EnregistrementVaccinationRepository enregistrementRepo;
    private final EnfantRepository enfantRepo;
    private final VaccinRepository vaccinRepo;
    private final CrecheRepository crecheRepo;
    private final SecurityUtils securityUtils;
    private final LogService logService;

    public EnregistrementVaccinationService(
            EnregistrementVaccinationRepository enregistrementRepo,
            EnfantRepository enfantRepo,
            VaccinRepository vaccinRepo,
            CrecheRepository crecheRepo,
            SecurityUtils securityUtils,
            LogService logService) {
        this.enregistrementRepo = enregistrementRepo;
        this.enfantRepo = enfantRepo;
        this.vaccinRepo = vaccinRepo;
        this.crecheRepo = crecheRepo;
        this.securityUtils = securityUtils;
        this.logService = logService;
    }

    public EnregistrementVaccination createEnregistrement(
            Long idEnfant,
            Long idVaccin,
            LocalDate dateVaccination,
            String nomCreche,
            Long idUser) {

        Enfant enfant = enfantRepo.findById(idEnfant)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        String nomCrecheEnfant = enfant.getCreche().getNom();
        if (!nomCrecheEnfant.equals(nomCreche)) {
            throw new IllegalArgumentException("L'enfant n'appartient pas a la creche selectionnee.");
        }
        verifierAuthorisationPourCreche(nomCrecheEnfant);

        Vaccin vaccin = vaccinRepo.findById(idVaccin)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));

        if (dateVaccination.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date de vaccination ne peut pas être dans le futur.");
        }
        if (dateVaccination.isBefore(enfant.getDateDeNaissance())) {
            throw new IllegalArgumentException("La date de vaccination ne peut pas être avant la naissance de l'enfant.");
        }
        List<EnregistrementVaccination> existants = enregistrementRepo.findByIdIdEnfant(idEnfant);
        Optional<LocalDate> derniere = existants.stream()
                .filter(ev -> ev.getVaccin().getId().equals(idVaccin))
                .map(ev -> ev.getId().getDateVaccination())
                .max(LocalDate::compareTo);
        if (derniere.isPresent() && dateVaccination.isBefore(derniere.get())) {
            throw new IllegalArgumentException("La date ne peut pas être antérieure à la dose précédente (" + derniere.get() + ").");
        }

        Creche creche = crecheRepo.findById(nomCrecheEnfant)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));

        User user = securityUtils.getCurrentUser();

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

        EnregistrementVaccination saved = enregistrementRepo.save(ev);

        logService.log("AJOUTER_ENREGISTREMENT", user, creche, enfant, vaccin,
                "date=" + dateVaccination + ", user=" + user.getPrenom());

        return saved;
    }

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

        if (nouvelleDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date de vaccination ne peut pas être dans le futur.");
        }
        if (nouvelleDate.isBefore(ancien.getEnfant().getDateDeNaissance())) {
            throw new IllegalArgumentException("La date de vaccination ne peut pas être avant la naissance de l'enfant.");
        }

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

        EnregistrementVaccination saved = enregistrementRepo.save(nouveau);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("MODIFIER_ENREGISTREMENT", currentUser, ancien.getCreche(), ancien.getEnfant(), newVaccin,
                "ancien: vaccin=" + idVaccin + ", date=" + ancienneDate
                + " | nouveau: vaccin=" + newIdVaccin + ", date=" + nouvelleDate
                + ", user=" + ancien.getUser().getPrenom());

        return saved;
    }

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

        Creche creche = enregistrement.getCreche();
        Enfant enfant = enregistrement.getEnfant();
        Vaccin vaccin = enregistrement.getVaccin();
        String userPrenom = enregistrement.getUser().getPrenom();

        enregistrementRepo.delete(enregistrement);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("SUPPRIMER_ENREGISTREMENT", currentUser, creche, enfant, vaccin,
                "date=" + dateVaccination + ", user=" + userPrenom);
    }

    public List<EnregistrementVaccination> getEnregistrementsByEnfant(Long idEnfant) {
        Enfant enfant = enfantRepo.findById(idEnfant)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(enfant.getCreche().getNom());
        return enregistrementRepo.findByIdIdEnfant(idEnfant);
    }

    public List<EnregistrementVaccination> getEnregistrementsByCreche(String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        return enregistrementRepo.findByCrecheNom(nomCreche);
    }

    private void verifierAuthorisationPourCreche(String nomCreche) {
        User current = securityUtils.getCurrentUser();
        if (!securityUtils.isProprietaireCreche(current, nomCreche)) {
            throw new SecurityException("Vous n'êtes pas autorisé à modifier cette crèche");
        }
    }
}
