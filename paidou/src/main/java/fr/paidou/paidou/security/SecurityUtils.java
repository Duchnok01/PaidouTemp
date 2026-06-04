package fr.paidou.paidou.security;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.repository.RolePermissionRepository;
import fr.paidou.paidou.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Component
public class SecurityUtils {

    private final UserRepository userRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final CrecheRepository crecheRepository;

    private static final List<String> ROLE_HIERARCHY = List.of("superadmin", "pdg", "coordinateur", "directrice");

    public SecurityUtils(UserRepository userRepository,
                         RolePermissionRepository rolePermissionRepository,
                         CrecheRepository crecheRepository) {
        this.userRepository = userRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.crecheRepository = crecheRepository;
    }

    // ==================== UTILISATEUR COURANT ====================

    // Renvoie l'utilisateur effectif (simulé ou réel)
    public User getCurrentUser() {
        Long simulatedUserId = getSimulatedUserId();
        if (simulatedUserId != null) {
            User simulated = userRepository.findById(simulatedUserId).orElse(null);
            if (simulated != null && !simulated.isEstParti()) {
                User realUser = getRealUser();
                if (canSimulateUser(realUser, simulated)) {
                    return simulated;
                }
            }
        }
        return getRealUser();
    }

    // Renvoie l'utilisateur réellement connecté (jamais simulé)
    public User getRealUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("Aucun utilisateur connecté");
        }
        String prenom = auth.getName();
        User user = userRepository.findByPrenom(prenom)
                .orElseThrow(() -> new IllegalStateException("Utilisateur connecté introuvable en base"));
        if (user.isEstParti()) {
            throw new SecurityException("Compte désactivé");
        }
        return user;
    }

    // Renvoie l'utilisateur réel si on simule, sinon null
    public User getRealUserIfSimulating() {
        if (getSimulatedUserId() != null) {
            return getRealUser();
        }
        return null;
    }

    // ==================== PERMISSIONS ====================

    public boolean hasPermission(String permissionCode) {
        String role = getCurrentUser().getRole();
        if (role.equals("superadmin")) return true;
        return rolePermissionRepository.findByRole(role).stream()
                .anyMatch(rp -> rp.getPermission().getCode().equals(permissionCode));
    }

    public boolean hasRole(String role) {
        return getCurrentUser().getRole().equals(role);
    }

    // ==================== PROPRIÉTÉ CRÈCHE ====================

    public boolean isProprietaireCreche(User user, String nomCreche) {
        if (user.getRole().equals("superadmin") || user.getRole().equals("pdg")) return true;

        Creche creche = crecheRepository.findById(nomCreche).orElse(null);
        if (creche == null) return false;

        if (user.getRole().equals("directrice")) {
            return creche.getDirecteur().getId().equals(user.getId());
        }

        if (user.getRole().equals("coordinateur")) {
            User directrice = creche.getDirecteur();
            return directrice.getCoordinateur() != null
                && directrice.getCoordinateur().getId().equals(user.getId());
        }

        return false;
    }

    // ==================== SIMULATION D'IDENTITÉ ====================

    // Vérifie si un utilisateur peut en simuler un autre (rôle strictement supérieur)
    public boolean canSimulateUser(User realUser, User targetUser) {
        int realIndex = ROLE_HIERARCHY.indexOf(realUser.getRole());
        int targetIndex = ROLE_HIERARCHY.indexOf(targetUser.getRole());
        if (realIndex >= targetIndex) return false;

        // Un coordinateur ne peut simuler que SES directrices
        if (realUser.getRole().equals("coordinateur")) {
            return targetUser.getCoordinateur() != null
                && targetUser.getCoordinateur().getId().equals(realUser.getId());
        }

        return true;
    }

    // Stocke l'ID de l'utilisateur simulé dans la session
    public void setSimulatedUserId(Long userId) {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpSession session = attrs.getRequest().getSession();
            session.setAttribute("simulatedUserId", userId);
        }
    }

    // Récupère l'ID de l'utilisateur simulé depuis la session
    public Long getSimulatedUserId() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpSession session = attrs.getRequest().getSession(false);
            if (session != null) {
                return (Long) session.getAttribute("simulatedUserId");
            }
        }
        return null;
    }

    // Arrête la simulation
    public void stopSimulation() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpSession session = attrs.getRequest().getSession(false);
            if (session != null) {
                session.removeAttribute("simulatedUserId");
            }
        }
    }

    // Renvoie la liste des utilisateurs que l'utilisateur courant peut simuler
    public List<User> getSimulatableUsers() {
        User realUser = getRealUser();
        if (realUser.getRole().equals("superadmin") || realUser.getRole().equals("pdg")) {
            return userRepository.findAll().stream()
                    .filter(u -> canSimulateUser(realUser, u))
                    .toList();
        }
        if (realUser.getRole().equals("coordinateur")) {
            return userRepository.findAll().stream()
                    .filter(u -> u.getCoordinateur() != null
                            && u.getCoordinateur().getId().equals(realUser.getId()))
                    .toList();
        }
        return List.of();
    }
}