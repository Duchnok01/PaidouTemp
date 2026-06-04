package fr.paidou.paidou.service;

import fr.paidou.paidou.controller.EnfantController.EnfantStatutGlobalDTO;
import fr.paidou.paidou.controller.EnfantController.VaccinStatusDTO;
import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.model.Log;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.repository.EnregistrementVaccinationRepository;
import fr.paidou.paidou.repository.LogRepository;
import fr.paidou.paidou.security.SecurityUtils;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class EnfantService {

    private final CrecheRepository crecheRepo;
    private final EnfantRepository enfantRepo;
    private final SecurityUtils securityUtils;
    private final VaccinService vaccinService;
    private final EnregistrementVaccinationRepository enregistrementRepo;
    private final LogService logService;
    private final LogRepository logRepository;

    public EnfantService(CrecheRepository cRep, EnfantRepository eRep, SecurityUtils securityUtils,
                         EnregistrementVaccinationRepository evRep, VaccinService vaccinService,
                         LogService logService, LogRepository logRepository) {
        this.crecheRepo = cRep;
        this.enfantRepo = eRep;
        this.securityUtils = securityUtils;
        this.enregistrementRepo = evRep;
        this.vaccinService = vaccinService;
        this.logService = logService;
        this.logRepository = logRepository;
    }

    public void reactiverEnfant(Long id) {
        Enfant enfant = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        enfant.setEstParti(false);
        enfantRepo.save(enfant);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("REACTIVER_ENFANT", currentUser, enfant.getCreche(), enfant,
                "id=" + id + ", prenom=" + enfant.getPrenom() + ", nom=" + enfant.getNom());
    }

    private void verifierAuthorisationPourCreche(String nomCreche) {
        User current = securityUtils.getCurrentUser();
        if (!securityUtils.isProprietaireCreche(current, nomCreche)) {
            throw new SecurityException("Vous ne pouvez pas modifier des enfants de cette crèche");
        }
    }

    public void createEnfant(String nom, String prenom, LocalDate birth, String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        Creche c = crecheRepo.findById(nomCreche)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        Enfant child = new Enfant();
        child.setPrenom(prenom);
        child.setNom(nom);
        child.setDateDeNaissance(birth);
        child.setCreche(c);
        enfantRepo.save(child);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CREER_ENFANT", currentUser, c, child,
                "prenom=" + prenom + ", nom=" + nom + ", dateNaissance=" + birth);
    }

    public void deleteEnfantPhysique(Long id) {
        Enfant enfant = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));

        String ancienPrenom = enfant.getPrenom();
        String ancienNom = enfant.getNom();
        LocalDate ancienneDate = enfant.getDateDeNaissance();

        enfant.setPrenom("<enfant supprimé>");
        enfant.setNom("<anonymisé>");
        enfant.setDateDeNaissance(LocalDate.of(1970, 1, 1));
        enfant.setEstParti(true);
        enfantRepo.save(enfant);

        List<Log> logs = logRepository.findByEnfantId(id);
        for (Log log : logs) {
            String details = log.getDetails();
            if (details != null) {
                details = details.replace(ancienPrenom, "<anonymisé>")
                                 .replace(ancienNom, "<anonymisé>")
                                 .replace(ancienneDate.toString(), "1970-01-01");
                log.setDetails(details);
                logRepository.save(log);
            }
        }

        User currentUser = securityUtils.getCurrentUser();
        logService.log("SUPPRIMER_ENFANT", currentUser, enfant.getCreche(), enfant,
                "ancienPrenom=" + ancienPrenom + ", ancienNom=" + ancienNom + ", ancienneDate=" + ancienneDate);
    }

    public List<Enfant> getAllEnfantsByCreche(String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        return enfantRepo.findByCrecheNom(nomCreche);
    }

    public void changeCreche(Long id, String nomCreche) {
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(child.getCreche().getNom());
        Creche ancienneCreche = child.getCreche();
        Creche nouvelleCreche = crecheRepo.findById(nomCreche.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Crèche cible introuvable"));
        child.setCreche(nouvelleCreche);
        enfantRepo.save(child);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("TRANSFERER_ENFANT", currentUser, nouvelleCreche, child,
                "de " + ancienneCreche.getNom() + " vers " + nomCreche
                + ", enfant=" + child.getPrenom() + " " + child.getNom());
    }

    public void rectifierInfos(Long id, String nom, String prenom, LocalDate birth) {
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(child.getCreche().getNom());

        String ancienNom = child.getNom();
        String ancienPrenom = child.getPrenom();
        LocalDate ancienneDate = child.getDateDeNaissance();

        child.setPrenom(prenom);
        child.setNom(nom);
        child.setDateDeNaissance(birth);
        enfantRepo.save(child);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("RECTIFIER_ENFANT", currentUser, child.getCreche(), child,
                "ancienNom=" + ancienNom + ", ancienPrenom=" + ancienPrenom + ", ancienneDate=" + ancienneDate
                + ", nouveauNom=" + nom + ", nouveauPrenom=" + prenom + ", nouvelleDate=" + birth);
    }

    public void disableChildAccount(Long id) {
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(child.getCreche().getNom());
        child.setEstParti(true);
        enfantRepo.save(child);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("DESACTIVER_ENFANT", currentUser, child.getCreche(), child,
                "id=" + id + ", prenom=" + child.getPrenom() + ", nom=" + child.getNom());
    }

    public void transferAllEnfants(String fromCreche, String toCreche) {
        // Autorisation gérée par le contrôleur
        String fromNorm = fromCreche.toLowerCase();
        String toNorm = toCreche.toLowerCase();
        if (fromNorm.equals(toNorm)) {
            throw new IllegalArgumentException("Impossible de transférer vers la même crèche");
        }
        Creche crecheSource = crecheRepo.findById(fromNorm)
                .orElseThrow(() -> new IllegalArgumentException("Crèche source introuvable"));
        Creche crecheCible = crecheRepo.findById(toNorm)
                .orElseThrow(() -> new IllegalArgumentException("Crèche cible introuvable"));
        List<Enfant> enfants = enfantRepo.findByCrecheNom(fromNorm);
        for (Enfant enfant : enfants) {
            enfant.setCreche(crecheCible);
            enfantRepo.save(enfant);
        }
        List<EnregistrementVaccination> evs = enregistrementRepo.findByCrecheNom(fromNorm);
        for (EnregistrementVaccination ev : evs) {
            ev.setCreche(crecheCible);
            enregistrementRepo.save(ev);
        }

        User currentUser = securityUtils.getCurrentUser();
        logService.log("TRANSFERER_TOUS_ENFANTS", currentUser, crecheSource,
                fromNorm + " -> " + toNorm);
    }

    // ======== STATUT VACCINAL (inchangé) ========
    // (méthodes getStatutVaccinal, getStatutsVaccinauxParCreche, getEnfantsByCreche, getEnfantById)
    // ... (inchangé, repris ci-dessous pour compilation)
    public List<VaccinStatusDTO> getStatutVaccinal(Long enfantId) {
        // ... (inchangé)
        return null; // placeholder - à remplacer par le corps existant
    }
    public List<EnfantStatutGlobalDTO> getStatutsVaccinauxParCreche(String nomCreche) {
        // ... (inchangé)
        return null;
    }
    public List<Enfant> getEnfantsByCreche(String nomCreche) {
        // ... (inchangé)
        return null;
    }
    public Enfant getEnfantById(Long id) {
        // ... (inchangé)
        return null;
    }
}