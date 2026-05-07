
package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.model.User;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import fr.paidou.paidou.security.SecurityUtils;



@Service
public class EnfantService {

    private final CrecheRepository crecheRepo;
    private final EnfantRepository enfantRepo;
    private final SecurityUtils securityUtils;

    public EnfantService(CrecheRepository cRep, EnfantRepository eRep, SecurityUtils securityUtils) {
        this.crecheRepo = cRep;
        this.enfantRepo = eRep;
        this.securityUtils = securityUtils;
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
        // ... (le reste inchangé)
    }

    public void changeCreche(Long id, String nomCreche) {
        verifierAuthorisationPourCreche(nomCreche);
        // ... (reste)
    }

    public void rectifierInfos(Long id, String nom, String prenom, LocalDate birth) {
        // Récupérer l'enfant pour connaître sa crèche, et vérifier autorisation
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(child.getCreche().getNom());
        // ... modifications
    }

    public void disableChildAccount(Long id) {
        Enfant child = enfantRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));
        verifierAuthorisationPourCreche(child.getCreche().getNom());
        // ...
    }
}