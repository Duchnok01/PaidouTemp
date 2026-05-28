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

@Service
public class CrecheService {

    private final CrecheRepository crecheRepo;
    private final UserRepository userRepo;
    private final EnfantRepository enfantRepo;
    private final EnregistrementVaccinationRepository enregistrementRepo;
    private final SecurityUtils securityUtils;
    private final LogService logService;

    public CrecheService(CrecheRepository cRep, UserRepository uRep,
                         EnfantRepository eRep, EnregistrementVaccinationRepository evRepo,
                         SecurityUtils securityUtils, LogService logService) {
        this.crecheRepo = cRep;
        this.userRepo = uRep;
        this.enfantRepo = eRep;
        this.enregistrementRepo = evRepo;
        this.securityUtils = securityUtils;
        this.logService = logService;
    }

    public void rouvrirCreche(String nom) {
        Creche creche = crecheRepo.findById(nom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        creche.setEstFerme(false);
        crecheRepo.save(creche);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("ROUVRIR_CRECHE", currentUser, creche, "nom=" + nom);
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

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CREER_CRECHE", currentUser, newCreche,
                "nom=" + nomNormalized + ", directeur=" + directeurPrenom);
    }

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
        Creche c = crecheRepo.findById(nomCreche.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        User newDir = userRepo.findByPrenom(nouveauDirecteurPrenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Nouveau directeur introuvable"));

        String ancienDirecteurPrenom = c.getDirecteur().getPrenom();
        c.setDirecteur(newDir);
        crecheRepo.save(c);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CHANGER_DIRECTEUR", currentUser, c,
                ancienDirecteurPrenom + " -> " + nouveauDirecteurPrenom);
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

            User currentUser = securityUtils.getCurrentUser();
            logService.log("RENOMMER_CRECHE", currentUser, newCreche,
                    ancienNomNorm + " -> " + nouveauNomNorm);
        }
    }

    public void fermerCreche(String nom) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut fermer une crèche");
        }
        Creche c = crecheRepo.findById(nom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        c.setEstFerme(true);
        crecheRepo.save(c);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("FERMER_CRECHE", currentUser, c, "nom=" + nom);
    }

    public void transfererTousEnfants(String fromCreche, String toCreche) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut transférer des enfants");
        }
        String from = fromCreche.toLowerCase();
        String to = toCreche.toLowerCase();
        if (from.equals(to)) {
            throw new IllegalArgumentException("Impossible de transférer vers la même crèche");
        }
        Creche source = crecheRepo.findById(from)
                .orElseThrow(() -> new IllegalArgumentException("Crèche source introuvable"));
        Creche cible = crecheRepo.findById(to)
                .orElseThrow(() -> new IllegalArgumentException("Crèche cible introuvable"));
        List<Enfant> enfants = enfantRepo.findByCrecheNom(from);
        for (Enfant e : enfants) {
            e.setCreche(cible);
            enfantRepo.save(e);
        }
        List<EnregistrementVaccination> evs = enregistrementRepo.findByCrecheNom(from);
        for (EnregistrementVaccination ev : evs) {
            ev.setCreche(cible);
            enregistrementRepo.save(ev);
        }

        User currentUser = securityUtils.getCurrentUser();
        logService.log("TRANSFERER_ENFANTS_CRECHE", currentUser, source,
                from + " -> " + to);
    }

    public void deleteCreche(String nom) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut supprimer une crèche");
        }
        String nomNorm = nom.toLowerCase();
        Creche creche = crecheRepo.findById(nomNorm)
                .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));
        if (!enfantRepo.findByCrecheNom(nomNorm).isEmpty()) {
            throw new IllegalArgumentException(
                "Impossible de supprimer : la crèche contient encore des enfants. Transférez-les d'abord.");
        }
        if (!enregistrementRepo.findByCrecheNom(nomNorm).isEmpty()) {
            throw new IllegalArgumentException(
                "Impossible de supprimer : la crèche a des enregistrements de vaccination.");
        }
        User currentUser = securityUtils.getCurrentUser();
        logService.log("SUPPRIMER_CRECHE", currentUser, creche, "nom=" + nomNorm);
        crecheRepo.delete(creche);

    }
}