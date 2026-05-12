package fr.paidou.paidou.service;

import fr.paidou.paidou.controller.CrecheController.CrecheSummaryDTO;
import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.repository.EnregistrementVaccinationRepository;
import fr.paidou.paidou.repository.UserRepository;
import fr.paidou.paidou.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CrecheService {

    private final CrecheRepository crecheRepo;
    private final UserRepository userRepo;
    private final EnfantRepository enfantRepo;
    private final EnregistrementVaccinationRepository enregistrementRepo;
    private final SecurityUtils securityUtils;

    public CrecheService(CrecheRepository cRep, UserRepository uRep,
                         EnfantRepository eRep, EnregistrementVaccinationRepository evRepo,
                         SecurityUtils securityUtils) {
        this.crecheRepo = cRep;
        this.userRepo = uRep;
        this.enfantRepo = eRep;
        this.enregistrementRepo = evRepo;
        this.securityUtils = securityUtils;
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

    // Récupère les crèches avec le nombre d'enfants (DTO enrichi)
    public List<CrecheSummaryDTO> getAllCrechesWithInfos() {
        return crecheRepo.findAll().stream()
                .map(c -> new CrecheSummaryDTO(
                        c.getNom(),
                        c.getDirecteur().getPrenom(),
                        c.isEstFerme(),
                        enfantRepo.countByCrecheNom(c.getNom())))
                .toList();
    }

    public List<CrecheSummaryDTO> getMesCrechesWithInfos() {
        User currentUser = securityUtils.getCurrentUser();
        return crecheRepo.findByDirecteurId(currentUser.getId()).stream()
                .map(c -> new CrecheSummaryDTO(
                        c.getNom(),
                        c.getDirecteur().getPrenom(),
                        c.isEstFerme(),
                        enfantRepo.countByCrecheNom(c.getNom())))
                .toList();
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
            Creche newCreche = new Creche();
            newCreche.setNom(nouveauNomNorm);
            newCreche.setDirecteur(creche.getDirecteur());
            newCreche.setEstFerme(creche.isEstFerme());
            crecheRepo.save(newCreche);
            // Transférer les enfants
            List<Enfant> enfants = enfantRepo.findByCrecheNom(ancienNomNorm);
            for (Enfant e : enfants) {
                e.setCreche(newCreche);
                enfantRepo.save(e);
            }
            // Transférer les enregistrements
            List<EnregistrementVaccination> evs = enregistrementRepo.findByCrecheNom(ancienNomNorm);
            for (EnregistrementVaccination ev : evs) {
                ev.setCreche(newCreche);
                enregistrementRepo.save(ev);
            }
            crecheRepo.delete(creche);
        }
    }

    public void deleteCreche(String nom) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut supprimer une crèche");
        }
        String nomNorm = nom.toLowerCase();
        Creche creche = crecheRepo.findById(nomNorm)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        if (!enfantRepo.findByCrecheNom(nomNorm).isEmpty()) {
            throw new IllegalArgumentException("Impossible de supprimer : la crèche contient encore des enfants.");
        }
        if (!enregistrementRepo.findByCrecheNom(nomNorm).isEmpty()) {
            throw new IllegalArgumentException("Impossible de supprimer : la crèche a des enregistrements de vaccination.");
        }
        crecheRepo.delete(creche);
    }
}