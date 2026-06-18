package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;

import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.security.SecurityUtils;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder;
    private final CrecheRepository crecheRepo;
    private final LogService logService;
    private final SecurityUtils securityUtils;
    private final PermissionService permissionService;

    public UserService(UserRepository uRep, BCryptPasswordEncoder bcpe, CrecheRepository crecheRepo,
                       LogService logService, SecurityUtils securityUtils,
                       PermissionService permissionService) {
        this.userRepo = uRep;
        this.encoder = bcpe;
        this.crecheRepo = crecheRepo;
        this.logService = logService;
        this.securityUtils = securityUtils;
        this.permissionService = permissionService;
    }

    public User getUserByPrenom(String prenom) {
        return userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
    }

    public String resetPassword(String prenom) {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        String mdp = UUID.randomUUID().toString();
        user.setMdp(encoder.encode(mdp));
        user.setDoitChangerMdp(true);
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("RESET_MDP", currentUser, "prenom=" + prenom);
        return mdp;
    }

    public void fixNameTypo(String prenom, String nvPrenom) {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setPrenom(nvPrenom.toLowerCase());
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("RENOMMER_USER", currentUser, prenom + " -> " + nvPrenom);
    }

    public void disableUserAccount(String prenom) {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setEstParti(true);
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("DESACTIVER_USER", currentUser, "prenom=" + prenom);
    }

    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    public void setPassword(String prenom, String passwd) {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setMdp(encoder.encode(passwd));
        user.setDoitChangerMdp(false);
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CHANGER_MDP", currentUser, "prenom=" + prenom);
    }

    public void reactiverUser(String prenom) {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setEstParti(false);
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("REACTIVER_USER", currentUser, "prenom=" + prenom);
    }

    public Boolean verifyPassword(String prenom, String passwd) {
        try {
            User user = userRepo.findByPrenom(prenom.toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
            return encoder.matches(passwd, user.getMdp());
        } catch (Exception e) {
            System.out.println("Erreur lors de la vérification du mot de passe: " + e.getMessage());
            return null;
        }
    }

    public String[] getRedirectInfo(String prenom) {
        User user = this.getUserByPrenom(prenom.toLowerCase());
        return new String[]{
            user.isDoitChangerMdp() ? "changer-mdp" : user.getRole().equals("directrice") ? "accueil" : user.getRole(),
            user.getRole(),
            user.getPrenom()
        };
    }

    public void deleteUser(String prenom) {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable"));

        List<Creche> creches = crecheRepo.findByDirecteurId(user.getId());
        if (!creches.isEmpty()) {
            throw new IllegalArgumentException(
                "Impossible de supprimer " + prenom + " : elle dirige encore la/les crèche(s) " +
                creches.stream().map(Creche::getNom).collect(java.util.stream.Collectors.joining(", "))
            );
        }

        if (userRepo.existsByCoordinateurId(user.getId())) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer " + prenom + " : cette personne coordonne encore des utilisatrices.");
        }

        userRepo.delete(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("SUPPRIMER_USER", currentUser, "prenom=" + prenom);
    }

    // Créer un utilisateur avec un rôle spécifique
    public String createUser(String prenom, String role) {
        String prenomNormalized = prenom.toLowerCase();
        if (userRepo.findByPrenom(prenomNormalized).isPresent()) {
            throw new IllegalArgumentException("Ce prénom existe déjà.");
        }
        User newUser = new User();
        newUser.setPrenom(prenomNormalized);
        newUser.setRole(role);
        String mdp = UUID.randomUUID().toString();
        newUser.setMdp(encoder.encode(mdp));
        userRepo.save(newUser);

        // Initialiser les permissions par défaut pour ce rôle
        permissionService.initDefaultPermissions(role);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CREER_USER", currentUser, "prenom=" + prenomNormalized + ", role=" + role);
        return mdp;
    }

    // Changer le rôle d'un utilisateur
    public void changeRole(Long id, String nouveauRole) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable"));
        if (!List.of("directrice", "coordinateur", "pdg", "superadmin").contains(nouveauRole)) {
            throw new IllegalArgumentException("Role inconnu : " + nouveauRole);
        }
        if (!nouveauRole.equals("directrice") && !crecheRepo.findByDirecteurId(user.getId()).isEmpty()) {
            throw new IllegalArgumentException("Impossible de changer ce role : l'utilisateur dirige encore une creche.");
        }
        if (!nouveauRole.equals("coordinateur") && userRepo.existsByCoordinateurId(user.getId())) {
            throw new IllegalArgumentException("Impossible de changer ce role : l'utilisateur coordonne encore d'autres personnes.");
        }
        String ancienRole = user.getRole();
        user.setRole(nouveauRole);
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CHANGER_ROLE", currentUser, user.getPrenom() + " : " + ancienRole + " -> " + nouveauRole);
    }

    // Définir un mot de passe par ID
    public void setPasswordById(Long id, String passwd) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable"));
        user.setMdp(encoder.encode(passwd));
        user.setDoitChangerMdp(false);
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("DEFINIR_MDP", currentUser, "prenom=" + user.getPrenom());
    }

    // Forcer le changement de MDP
    public void forceChangeMdp(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable"));
        user.setDoitChangerMdp(true);
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("FORCER_CHANGEMENT_MDP", currentUser, "prenom=" + user.getPrenom());
    }

    // Changer la coordinatrice d'une directrice
    public void changeCoordinateur(Long id, String coordoPrenom) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable"));
        if (!user.getRole().equals("directrice") && !user.getRole().equals("coordinateur")) {
            throw new IllegalArgumentException("Seule une directrice ou une coordinatrice peut avoir une coordinatrice");
        }
        User coordo = userRepo.findByPrenom(coordoPrenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Coordinatrice introuvable"));
        if (!coordo.getRole().equals("coordinateur")) {
            throw new IllegalArgumentException(coordoPrenom + " n'est pas une coordinatrice");
        }
        if (coordo.getId().equals(user.getId())) {
            throw new IllegalArgumentException("Une coordinatrice ne peut pas être sa propre coordinatrice");
        }
        if (createsCoordinateurCycle(user, coordo)) {
            throw new IllegalArgumentException("Cette affectation creerait une boucle de coordination");
        }
        user.setCoordinateur(coordo);
        userRepo.save(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CHANGER_COORDINATRICE", currentUser, user.getPrenom() + " -> " + coordoPrenom);
    }

    private boolean createsCoordinateurCycle(User user, User newCoordinateur) {
        User cursor = newCoordinateur;
        while (cursor != null) {
            if (cursor.getId().equals(user.getId())) {
                return true;
            }
            cursor = cursor.getCoordinateur();
        }
        return false;
    }

    // Retirer la crèche d'une directrice
    public void retirerCreche(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable"));
        List<Creche> creches = crecheRepo.findByDirecteurId(id);
        for (Creche c : creches) {
            c.setDirecteur(null);
            crecheRepo.save(c);
        }

        User currentUser = securityUtils.getCurrentUser();
        logService.log("RETIRER_CRECHE", currentUser, "prenom=" + user.getPrenom() + ", creches=" + creches.size());
    }

    // Transférer toutes les crèches d'une directrice à une autre
    public void transfererCreches(String fromPrenom, String toPrenom) {
        User from = userRepo.findByPrenom(fromPrenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Directrice source introuvable"));
        User to = userRepo.findByPrenom(toPrenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Directrice cible introuvable"));
        if (!to.getRole().equals("directrice")) {
            throw new IllegalArgumentException(toPrenom + " n'est pas une directrice");
        }

        List<Creche> crechesFrom = crecheRepo.findByDirecteurId(from.getId());
        List<Creche> crechesTo = crecheRepo.findByDirecteurId(to.getId());
        if (crechesTo.size() + crechesFrom.size() > 3) {
            throw new IllegalArgumentException(toPrenom + " aurait plus de 3 crèches après le transfert");
        }

        for (Creche c : crechesFrom) {
            c.setDirecteur(to);
            crecheRepo.save(c);
        }

        User currentUser = securityUtils.getCurrentUser();
        logService.log("TRANSFERER_CRECHES", currentUser,
                "de " + fromPrenom + " (" + crechesFrom.size() + " crèches) vers " + toPrenom);
    }
}
