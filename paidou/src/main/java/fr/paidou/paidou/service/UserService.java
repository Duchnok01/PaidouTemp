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

    public UserService(UserRepository uRep, BCryptPasswordEncoder bcpe, CrecheRepository crecheRepo,
                       LogService logService, SecurityUtils securityUtils) {
        this.userRepo = uRep;
        this.encoder = bcpe;
        this.crecheRepo = crecheRepo;
        this.logService = logService;
        this.securityUtils = securityUtils;
    }

    public String createUser(String prenom) {
        String prenomNormalized = prenom.toLowerCase();
        if (userRepo.findByPrenom(prenomNormalized).isPresent()) {
            throw new IllegalArgumentException("Ce prénom existe déjà dans la liste des directions.");
        }
        User newUser = new User();
        newUser.setPrenom(prenomNormalized);
        String mdp = UUID.randomUUID().toString();
        newUser.setMdp(encoder.encode(mdp));
        userRepo.save(newUser);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("CREER_USER", currentUser, "prenom=" + prenomNormalized);
        return mdp;
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

        userRepo.delete(user);

        User currentUser = securityUtils.getCurrentUser();
        logService.log("SUPPRIMER_USER", currentUser, "prenom=" + prenom);
    }
}