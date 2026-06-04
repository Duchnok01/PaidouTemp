package fr.paidou.paidou.service;

import fr.paidou.paidou.controller.VaccinController.VaccinPourEnfantDTO;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.repository.EnregistrementVaccinationRepository;
import fr.paidou.paidou.repository.VaccinRepository;
import fr.paidou.paidou.security.SecurityUtils;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class VaccinService {

    private final VaccinRepository vaccinRepo;
    private final SecurityUtils securityUtils;
    private final EnfantRepository enfantRepo;
    private final EnregistrementVaccinationRepository enregistrementRepo;
    private final LogService logService;

    public VaccinService(VaccinRepository vRep, SecurityUtils securityUtils,
                         EnfantRepository eRep, EnregistrementVaccinationRepository evRepo,
                         LogService logService) {
        this.vaccinRepo = vRep;
        this.securityUtils = securityUtils;
        this.enfantRepo = eRep;
        this.enregistrementRepo = evRepo;
        this.logService = logService;
    }

    public void reactiverVaccin(Long id) {
        Vaccin vaccin = vaccinRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));
        vaccin.setEstObsolete(false);
        vaccinRepo.save(vaccin);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("REACTIVER_VACCIN", currentUser, vaccin, "id=" + id + ", nom=" + vaccin.getNom());
    }

    public void createVaccin(String nom, String listeMaladies, Integer pourEnfantsNesAvant,
                             Integer pourEnfantsNesApres, Integer agePremiereVaccination,
                             Integer nbMoisPremierDelai, Integer nbMoisDeuxiemeDelai) {
        // Autorisation vérifiée par le contrôleur
        if (vaccinRepo.findByNom(nom.toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("Un vaccin avec ce nom existe déjà");
        }

        Vaccin newV = new Vaccin();
        newV.setNom(nom);
        newV.setMaladiesPrevenues(listeMaladies);
        newV.setPourEnfantsNesAvant(pourEnfantsNesAvant);
        newV.setPourEnfantsNesApres(pourEnfantsNesApres);
        newV.setAgePremiereVaccination(agePremiereVaccination);
        newV.setNbMoisPremierDelai(nbMoisPremierDelai);
        newV.setNbMoisDeuxiemeDelai(nbMoisDeuxiemeDelai);
        vaccinRepo.save(newV);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CREER_VACCIN", currentUser, newV, "nom=" + nom);
    }

    public List<Vaccin> getAllVaccins() {
        return vaccinRepo.findAll().stream()
                .filter(v -> !v.isEstObsolete())
                .toList();
    }

    public List<Vaccin> getAllVaccinsAdmin() {
        return vaccinRepo.findAll();
    }

    public void editVaccin(Long id, String nom, String listeMaladies, Integer pourEnfantsNesAvant,
                           Integer pourEnfantsNesApres, Integer agePremiereVaccination,
                           Integer nbMoisPremierDelai, Integer nbMoisDeuxiemeDelai) {
        // Autorisation vérifiée par le contrôleur
        Vaccin vaccin = vaccinRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));

        String ancienNom = vaccin.getNom();
        String ancienMaladies = vaccin.getMaladiesPrevenues();
        Integer ancienAvant = vaccin.getPourEnfantsNesAvant();
        Integer ancienApres = vaccin.getPourEnfantsNesApres();
        Integer ancienAge = vaccin.getAgePremiereVaccination();
        Integer ancienDelai1 = vaccin.getNbMoisPremierDelai();
        Integer ancienDelai2 = vaccin.getNbMoisDeuxiemeDelai();

        vaccin.setNom(nom);
        vaccin.setMaladiesPrevenues(listeMaladies);
        vaccin.setPourEnfantsNesAvant(pourEnfantsNesAvant);
        vaccin.setPourEnfantsNesApres(pourEnfantsNesApres);
        vaccin.setAgePremiereVaccination(agePremiereVaccination);
        vaccin.setNbMoisPremierDelai(nbMoisPremierDelai);
        vaccin.setNbMoisDeuxiemeDelai(nbMoisDeuxiemeDelai);
        vaccinRepo.save(vaccin);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("MODIFIER_VACCIN", currentUser, vaccin,
                "id=" + id
                + ", ancienNom=" + ancienNom + ", nouveauNom=" + nom
                + ", ancienMaladies=" + ancienMaladies + ", nouvellesMaladies=" + listeMaladies
                + ", ancienAvant=" + ancienAvant + ", nouveauAvant=" + pourEnfantsNesAvant
                + ", ancienApres=" + ancienApres + ", nouveauApres=" + pourEnfantsNesApres
                + ", ancienAge=" + ancienAge + ", nouvelAge=" + agePremiereVaccination
                + ", ancienDelai1=" + ancienDelai1 + ", nouveauDelai1=" + nbMoisPremierDelai
                + ", ancienDelai2=" + ancienDelai2 + ", nouveauDelai2=" + nbMoisDeuxiemeDelai);
    }

    public void rendreObsolete(Long id) {
        // Autorisation vérifiée par le contrôleur
        Vaccin vaccin = vaccinRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));
        vaccin.setEstObsolete(true);
        vaccinRepo.save(vaccin);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("RENDRE_OBSOLETE_VACCIN", currentUser, vaccin, "id=" + id + ", nom=" + vaccin.getNom());
    }

    public void deleteVaccinPhysique(Long id) {
        // Autorisation vérifiée par le contrôleur
        List<EnregistrementVaccination> evs = enregistrementRepo.findByIdIdVaccin(id);
        if (!evs.isEmpty()) {
            throw new IllegalArgumentException(
                "Impossible de supprimer ce vaccin : il est utilisé dans " + evs.size() + " enregistrement(s)."
            );
        }
        Vaccin vaccin = vaccinRepo.findById(id).orElse(null);
        vaccinRepo.deleteById(id);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("SUPPRIMER_VACCIN", currentUser, vaccin, "id=" + id + (vaccin != null ? ", nom=" + vaccin.getNom() : ""));
    }

    public Vaccin getVaccinById(Long id) {
        return vaccinRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));
    }

    public List<VaccinPourEnfantDTO> getVaccinsPourEnfant(Long enfantId) {
        Enfant enfant = enfantRepo.findById(enfantId)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        List<Vaccin> vaccins = getAllVaccins();
        List<EnregistrementVaccination> enregistrements = enregistrementRepo.findByIdIdEnfant(enfantId);
        int annee = enfant.getDateDeNaissance().getYear();
        List<VaccinPourEnfantDTO> result = new ArrayList<>();
        for (Vaccin v : vaccins) {
            if (v.getPourEnfantsNesAvant() != null && annee > v.getPourEnfantsNesAvant()) continue;
            if (v.getPourEnfantsNesApres() != null && annee < v.getPourEnfantsNesApres()) continue;
            long recues = enregistrements.stream().filter(ev -> ev.getVaccin().getId().equals(v.getId())).count();
            int requises = v.getNbMoisDeuxiemeDelai() != null ? 3 : 2;
            boolean complet = recues >= requises;
            result.add(new VaccinPourEnfantDTO(v.getId(), v.getNom(), recues, requises, complet));
        }
        return result;
    }
}