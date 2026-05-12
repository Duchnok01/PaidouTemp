package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.model.User;
    import fr.paidou.paidou.repository.EnregistrementVaccinationRepository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class EnfantService {

    private final CrecheRepository crecheRepo;
    private final EnfantRepository enfantRepo;
    private final SecurityUtils securityUtils;
    
    private final EnregistrementVaccinationRepository enregistrementRepo;
    
    public EnfantService(CrecheRepository cRep, EnfantRepository eRep, SecurityUtils securityUtils,
                         EnregistrementVaccinationRepository evRep) {
        this.crecheRepo = cRep;
        this.enfantRepo = eRep;
        this.securityUtils = securityUtils;
        this.enregistrementRepo = evRep;
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

    public void changeCreche(Long id, String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        Creche c = crecheRepo.findById(nomCreche)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
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













    // ======== LECTURE ========

    public List<Enfant> getEnfantsByCreche(String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        return enfantRepo.findByCrecheNom(nomCreche);
    }

    public Enfant getEnfantById(Long id) {
        Enfant enfant = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(enfant.getCreche().getNom());
        return enfant;
    }
}