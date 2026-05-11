
package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.repository.CrecheRepository;

import java.util.List;

import org.springframework.stereotype.Service;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;
import fr.paidou.paidou.security.SecurityUtils;

@Service
public class CrecheService {

    private final CrecheRepository crecheRepo;
    private final UserRepository userRepo;
    private final SecurityUtils securityUtils;

    public CrecheService(CrecheRepository cRep, UserRepository uRep, SecurityUtils securityUtils) {
        this.crecheRepo = cRep;
        this.userRepo = uRep;
        this.securityUtils = securityUtils;
    }

    public void createCreche(String nom, String directeurPrenom) {
        // Seul un admin peut créer une crèche (temporaire)
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut créer une crèche");
        }
        Creche newCreche = new Creche();
        newCreche.setNom(nom);
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
}