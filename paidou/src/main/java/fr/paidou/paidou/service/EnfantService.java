package fr.paidou.paidou.service;

import fr.paidou.paidou.controller.EnfantController.EnfantStatutGlobalDTO;
import fr.paidou.paidou.controller.EnfantController.VaccinStatusDTO;
import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.repository.EnregistrementVaccinationRepository;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.LogService;

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

    public EnfantService(CrecheRepository cRep, EnfantRepository eRep, SecurityUtils securityUtils,
                         EnregistrementVaccinationRepository evRep, VaccinService vaccinService,
                         LogService logService) {
        this.crecheRepo = cRep;
        this.enfantRepo = eRep;
        this.securityUtils = securityUtils;
        this.enregistrementRepo = evRep;
        this.vaccinService = vaccinService;
        this.logService = logService;
        logService.log("CREER_ENFANT", securityUtils.getCurrentUser().getPrenom(), prenom + " " + nom + " (crèche: " + nomCreche + ")");
        logService.log("SUPPRIMER_ENFANT", securityUtils.getCurrentUser().getPrenom(), String.valueOf(id));
        logService.log("DESACTIVER_ENFANT", securityUtils.getCurrentUser().getPrenom(), String.valueOf(id));
        logService.log("TRANSFERER_ENFANT", securityUtils.getCurrentUser().getPrenom(), "id=" + id + " → " + nomCreche);
        logService.log("RECTIFIER_ENFANT", securityUtils.getCurrentUser().getPrenom(), String.valueOf(id));
        logService.log("TRANSFERER_TOUS_ENFANTS", securityUtils.getCurrentUser().getPrenom(), fromCreche + " → " + toCreche);
    }

    private void verifierAuthorisationPourCreche(String nomCreche) {
        User current = securityUtils.getCurrentUser();
        if (!securityUtils.isAdmin()) {
            Creche creche = crecheRepo.findById(nomCreche)
                    .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
            if (!creche.getDirecteur().getId().equals(current.getId())) {
                throw new SecurityException("Vous ne pouvez pas modifier des enfants de cette crèche");
            }
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
    }

    public void deleteEnfantPhysique(Long id) {
        Enfant enfant = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        List<EnregistrementVaccination> evs = enregistrementRepo.findByIdIdEnfant(id);
        enregistrementRepo.deleteAll(evs);
        enfantRepo.delete(enfant);
    }

    public List<Enfant> getAllEnfantsByCreche(String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        return enfantRepo.findByCrecheNom(nomCreche);
    }

    public void changeCreche(Long id, String nomCreche) {
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(child.getCreche().getNom());
        Creche c = crecheRepo.findById(nomCreche.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Crèche cible introuvable"));
        child.setCreche(c);
        enfantRepo.save(child);
    }

    public void rectifierInfos(Long id, String nom, String prenom, LocalDate birth) {
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(child.getCreche().getNom());
        child.setPrenom(prenom);
        child.setNom(nom);
        child.setDateDeNaissance(birth);
        enfantRepo.save(child);
    }

    public void disableChildAccount(Long id) {
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(child.getCreche().getNom());
        child.setEstParti(true);
        enfantRepo.save(child);
    }

    public void transferAllEnfants(String fromCreche, String toCreche) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut transférer des enfants");
        }
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
    }

    // ======== STATUT VACCINAL ========

    public List<VaccinStatusDTO> getStatutVaccinal(Long enfantId) {
        Enfant enfant = enfantRepo.findById(enfantId)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        List<Vaccin> vaccins = vaccinService.getAllVaccins();
        List<EnregistrementVaccination> enregistrements = enregistrementRepo.findByIdIdEnfant(enfantId);
        LocalDate aujourdhui = LocalDate.now();
        int anneeNaissance = enfant.getDateDeNaissance().getYear();
        List<VaccinStatusDTO> result = new ArrayList<>();
        
        for (Vaccin v : vaccins) {
            if (v.getPourEnfantsNesAvant() != null && anneeNaissance > v.getPourEnfantsNesAvant()) continue;
            if (v.getPourEnfantsNesApres() != null && anneeNaissance < v.getPourEnfantsNesApres()) continue;
            
            // Dates de doses recommandées (basées sur la date de naissance)
            LocalDate dose1Theorique = enfant.getDateDeNaissance().plusMonths(v.getAgePremiereVaccination());
            LocalDate dose2Theorique = dose1Theorique.plusMonths(v.getNbMoisPremierDelai());
            LocalDate dose3Theorique = v.getNbMoisDeuxiemeDelai() != null 
                    ? dose2Theorique.plusMonths(v.getNbMoisDeuxiemeDelai()) : null;
            
            // Doses réellement reçues (triées par date)
            List<LocalDate> datesReelles = enregistrements.stream()
                    .filter(ev -> ev.getVaccin().getId().equals(v.getId()))
                    .map(ev -> ev.getId().getDateVaccination())
                    .sorted()
                    .toList();
            
            long nbDosesRecues = datesReelles.size();
            
            // Ajuster les prochaines doses selon les dates réelles
            LocalDate dose1 = dose1Theorique;
            LocalDate dose2 = dose2Theorique;
            LocalDate dose3 = dose3Theorique;
            
            if (!datesReelles.isEmpty()) {
                LocalDate derniereReelle = datesReelles.get((int) nbDosesRecues - 1);
                if (nbDosesRecues == 1) {
                    // La 2ème dose est calculée à partir de la 1ère dose réelle
                    dose2 = derniereReelle.plusMonths(v.getNbMoisPremierDelai());
                    if (dose3 != null) dose3 = dose2.plusMonths(v.getNbMoisDeuxiemeDelai());
                } else if (nbDosesRecues == 2 && dose3 != null) {
                    // La 3ème dose est calculée à partir de la 2ème dose réelle
                    dose3 = derniereReelle.plusMonths(v.getNbMoisDeuxiemeDelai());
                }
            }
            
            String statut;
            if (nbDosesRecues >= (dose3 != null ? 3 : 2)) {
                statut = "COMPLET";
            } else if (nbDosesRecues == 1 && dose2.isBefore(aujourdhui)) {
                statut = "RETARD_DOSE2";
            } else if (nbDosesRecues == 2 && dose3 != null && dose3.isBefore(aujourdhui)) {
                statut = "RETARD_DOSE3";
            } else if (nbDosesRecues == 0 && dose1.isBefore(aujourdhui)) {
                statut = "RETARD_DOSE1";
            } else {
                statut = "EN_COURS";
            }
            
            result.add(new VaccinStatusDTO(v.getId(), v.getNom(), nbDosesRecues,
                    dose3 != null ? 3 : 2, dose1, dose2, dose3, statut));
        }
        return result;
    }

    public List<EnfantStatutGlobalDTO> getStatutsVaccinauxParCreche(String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        List<Enfant> enfants = enfantRepo.findByCrecheNom(nomCreche).stream()
                .filter(e -> !e.isEstParti()).toList();
        List<EnfantStatutGlobalDTO> result = new ArrayList<>();
        for (Enfant e : enfants) {
            List<VaccinStatusDTO> statuts = getStatutVaccinal(e.getId_enfant());
            VaccinStatusDTO plusUrgent = null;
            int priorite = 0;
            long minJours = Long.MAX_VALUE;
            for (VaccinStatusDTO s : statuts) {
                if (s.statut().startsWith("RETARD")) {
                    LocalDate dateDue = switch (s.statut()) {
                        case "RETARD_DOSE1" -> s.dateDose1Recommandee();
                        case "RETARD_DOSE2" -> s.dateDose2Recommandee();
                        case "RETARD_DOSE3" -> s.dateDose3Recommandee();
                        default -> null;
                    };
                    long joursRetard = ChronoUnit.DAYS.between(dateDue, LocalDate.now());
                    if (plusUrgent == null || !plusUrgent.statut().startsWith("RETARD") || joursRetard > minJours) {
                        plusUrgent = s;
                        minJours = joursRetard;
                        priorite = 1;
                    }
                } else if (s.statut().equals("EN_COURS") && priorite < 2) {
                    LocalDate prochaine = s.dosesRecues() == 0 ? s.dateDose1Recommandee() :
                                        s.dosesRecues() == 1 ? s.dateDose2Recommandee() : s.dateDose3Recommandee();
                    if (prochaine != null) {
                        long joursRestants = ChronoUnit.DAYS.between(LocalDate.now(), prochaine);
                        if (joursRestants <= 14 && (plusUrgent == null || joursRestants < minJours)) {
                            plusUrgent = s;
                            minJours = joursRestants;
                            priorite = 2;
                        } else if (priorite == 0) {
                            plusUrgent = s;
                            minJours = joursRestants;
                            priorite = 3;
                        }
                    }
                }
            }
            if (priorite == 0) priorite = 4;
            
            // Déterminer la date prévue selon le statut
            LocalDate datePrevue = null;
            if (plusUrgent != null) {
                String statut = plusUrgent.statut();
                long recues = plusUrgent.dosesRecues();
                if (statut.equals("RETARD_DOSE1") || recues == 0) {
                    datePrevue = plusUrgent.dateDose1Recommandee();
                } else if (statut.equals("RETARD_DOSE2") || recues == 1) {
                    datePrevue = plusUrgent.dateDose2Recommandee();
                } else if (statut.equals("RETARD_DOSE3") || statut.equals("EN_COURS") && recues == 2) {
                    datePrevue = plusUrgent.dateDose3Recommandee();
                } else if (statut.equals("EN_COURS") && recues == 0) {
                    datePrevue = plusUrgent.dateDose1Recommandee();
                } else if (statut.equals("EN_COURS") && recues == 1) {
                    datePrevue = plusUrgent.dateDose2Recommandee();
                } else if (statut.equals("COMPLET")) {
                    datePrevue = null;
                }
            }
            
            result.add(new EnfantStatutGlobalDTO(
                    e.getId_enfant(), e.getNom(), e.getPrenom(),
                    e.getDateDeNaissance(),
                    priorite == 1 ? "RETARD" : (priorite == 2 ? "PROCHE" : (priorite == 3 ? "EN_COURS" : "COMPLET")),
                    plusUrgent != null ? plusUrgent.nomVaccin() : "",
                    plusUrgent != null ? minJours : 0,
                    datePrevue
            ));
        }
        result.sort(Comparator.comparingInt((EnfantStatutGlobalDTO d) -> {
            if (d.statut().equals("RETARD")) return 0;
            if (d.statut().equals("PROCHE")) return 1;
            if (d.statut().equals("EN_COURS")) return 2;
            return 3;
        }).thenComparingLong(d -> d.statut().equals("RETARD") ? -d.jours() : d.jours()));
        return result;
    }

    // ======== LECTURE ========

    public List<Enfant> getEnfantsByCreche(String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        return enfantRepo.findByCrecheNom(nomCreche).stream()
                .filter(e -> !e.isEstParti())
                .toList();
    }

    public Enfant getEnfantById(Long id) {
        Enfant enfant = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(enfant.getCreche().getNom());
        return enfant;
    }
}
