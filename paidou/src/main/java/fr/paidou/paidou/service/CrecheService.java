
package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.repository.CrecheRepository;

import java.util.List;

import org.springframework.stereotype.Service;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.repository.EnregistrementVaccinationRepository;

@Service
public class CrecheService {

    private final CrecheRepository crecheRepo;
    private final UserRepository userRepo;
    private final SecurityUtils securityUtils;
    private final EnfantRepository enfantRepo;
    private final EnregistrementVaccinationRepository enregistrementRepo;
    
    public CrecheService(CrecheRepository cRep, UserRepository uRep, SecurityUtils securityUtils,
                         EnfantRepository eRep, EnregistrementVaccinationRepository evRepo) {
        this.crecheRepo = cRep;
        this.userRepo = uRep;
        this.securityUtils = securityUtils;
        this.enfantRepo = eRep;
        this.enregistrementRepo = evRepo;
    }

    public void createCreche(String nom, String directeurPrenom) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut créer une crèche");
        }
        String nomNormalized = nom.toLowerCase().trim();
        if (crecheRepo.findById(nomNormalized).isPresent()) {
            throw new IllegalArgumentException("Une crèche avec ce nom existe déjà");
        }
        Creche newCreche = new Creche();
        newCreche.setNom(nomNormalized);
        User dir = userRepo.findByPrenom(directeurPrenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Directeur introuvable"));
        newCreche.setDirecteur(dir);
        crecheRepo.save(newCreche);
    }









    public List<Creche> getAllCreches() {
        return crecheRepo.findAll();
    }


    public List<Creche> getMesCreches() {
        User currentUser = securityUtils.getCurrentUser();
        return crecheRepo.findByDirecteurId(currentUser.getId());
    }









    public void changeDirecteur(String nomCreche, String nouveauDirecteurPrenom) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut changer le directeur d'une crèche");
        }
        Creche c = crecheRepo.findById(nomCreche)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        User newDir = userRepo.findByPrenom(nouveauDirecteurPrenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Nouveau directeur introuvable"));
        c.setDirecteur(newDir);
        crecheRepo.save(c);
    }














    public void renameCreche(String ancienNom, String nouveauNom) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut renommer une crèche");
        }
        String ancienNomNorm = ancienNom.toLowerCase();
        String nouveauNomNorm = nouveauNom.toLowerCase().trim();
        
        Creche creche = crecheRepo.findById(ancienNomNorm)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        
        if (!ancienNomNorm.equals(nouveauNomNorm) && crecheRepo.findById(nouveauNomNorm).isPresent()) {
            throw new IllegalArgumentException("Une crèche avec ce nom existe déjà");
        }
        
        if (!ancienNomNorm.equals(nouveauNomNorm)) {
            // Créer la nouvelle crèche
            Creche newCreche = new Creche();
            newCreche.setNom(nouveauNomNorm);
            newCreche.setDirecteur(creche.getDirecteur());
            crecheRepo.save(newCreche);
            
            // Transférer les enfants
            List<Enfant> enfants = enfantRepo.findByCrecheNom(ancienNomNorm);
            for (Enfant enfant : enfants) {
                enfant.setCreche(newCreche);
                enfantRepo.save(enfant);
            }
            
            // Transférer les enregistrements
            List<EnregistrementVaccination> evs = enregistrementRepo.findByCrecheNom(ancienNomNorm);
            for (EnregistrementVaccination ev : evs) {
                ev.setCreche(newCreche);
                enregistrementRepo.save(ev);
            }
            
            // Supprimer l'ancienne
            crecheRepo.delete(creche);
        }
    }

















    public void deleteCreche(String nom) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut supprimer une crèche");
        }
        String nomNormalized = nom.toLowerCase();
        Creche creche = crecheRepo.findById(nomNormalized)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        
        // Vérifier si la crèche a des enfants
        List<Enfant> enfants = enfantRepo.findByCrecheNom(nomNormalized);
        if (!enfants.isEmpty()) {
            throw new IllegalArgumentException(
                "Impossible de supprimer la crèche " + nom + " : elle contient " + enfants.size() + " enfant(s)."
            );
        }
        
        // Vérifier si la crèche a des enregistrements de vaccination
        List<EnregistrementVaccination> enregistrements = enregistrementRepo.findByCrecheNom(nomNormalized);
        if (!enregistrements.isEmpty()) {
            throw new IllegalArgumentException(
                "Impossible de supprimer la crèche " + nom + " : elle contient " + enregistrements.size() + " enregistrement(s) de vaccination."
            );
        }
        
        crecheRepo.delete(creche);
    }






























}