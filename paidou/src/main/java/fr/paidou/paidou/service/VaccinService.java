package fr.paidou.paidou.service;

import fr.paidou.paidou.controller.VaccinController.VaccinPourEnfantDTO;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.repository.EnregistrementVaccinationRepository;
import fr.paidou.paidou.repository.VaccinRepository;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.LogService;

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
        logService.log("CREER_VACCIN", securityUtils.getCurrentUser().getPrenom(), nom);
        logService.log("RENDRE_OBSOLETE_VACCIN", securityUtils.getCurrentUser().getPrenom(), String.valueOf(id));
        logService.log("SUPPRIMER_VACCIN", securityUtils.getCurrentUser().getPrenom(), String.valueOf(id));
    }

    public void createVaccin(String nom, String listeMaladies, Integer pourEnfantsNesAvant,
                             Integer pourEnfantsNesApres, Integer agePremiereVaccination,
                             Integer nbMoisPremierDelai, Integer nbMoisDeuxiemeDelai) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut créer un vaccin");
        }
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
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut modifier un vaccin");
        }
        Vaccin newV = vaccinRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));
        newV.setNom(nom);
        newV.setMaladiesPrevenues(listeMaladies);
        newV.setPourEnfantsNesAvant(pourEnfantsNesAvant);
        newV.setPourEnfantsNesApres(pourEnfantsNesApres);
        newV.setAgePremiereVaccination(agePremiereVaccination);
        newV.setNbMoisPremierDelai(nbMoisPremierDelai);
        newV.setNbMoisDeuxiemeDelai(nbMoisDeuxiemeDelai);
        vaccinRepo.save(newV);
    }

    public void rendreObsolete(Long id) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut rendre un vaccin obsolète");
        }
        Vaccin vaccin = vaccinRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));
        vaccin.setEstObsolete(true);
        vaccinRepo.save(vaccin);
    }

    public void deleteVaccinPhysique(Long id) {
        if (!securityUtils.isAdmin()) throw new SecurityException("Admin requis");
        List<EnregistrementVaccination> evs = enregistrementRepo.findByIdIdVaccin(id);
        if (!evs.isEmpty()) {
            throw new IllegalArgumentException(
                "Impossible de supprimer ce vaccin : il est utilisé dans " + evs.size() + " enregistrement(s)."
            );
        }
        vaccinRepo.deleteById(id);
    }

    public Vaccin getVaccinById(Long id) {
        return vaccinRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));
    }

    public List<VaccinPourEnfantDTO> getVaccinsPourEnfant(Long enfantId) {
        Enfant enfant = enfantRepo.findById(enfantId)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        List<Vaccin> vaccins = getAllVaccins(); // non obsolètes
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
