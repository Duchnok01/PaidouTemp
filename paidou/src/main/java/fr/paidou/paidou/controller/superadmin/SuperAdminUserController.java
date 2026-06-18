package fr.paidou.paidou.controller.superadmin;

import fr.paidou.paidou.model.User;
import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/superadmin/users", "/admin/users"})
public class SuperAdminUserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    public SuperAdminUserController(UserService userService, SecurityUtils securityUtils) {
        this.userService = userService;
        this.securityUtils = securityUtils;
    }

    // GET tous les utilisateurs
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        if (!securityUtils.hasPermission("VOIR_TOUS_UTILISATEURS")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // POST créer un utilisateur avec rôle
    @PostMapping
    public ResponseEntity<String> createUser(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("CREER_UTILISATEUR")) {
            return ResponseEntity.status(403).build();
        }
        String prenom = request.get("prenom");
        String role = request.getOrDefault("role", "directrice");
        String mdp = userService.createUser(prenom, role);
        return ResponseEntity.ok(mdp);
    }

    // PUT changer rôle (bulk)
    @PutMapping("/change-role-bulk")
    public ResponseEntity<Void> changeRoleBulk(@RequestBody Map<String, Object> request) {
        if (!securityUtils.hasPermission("CHANGER_ROLE_UTILISATEUR")) {
            return ResponseEntity.status(403).build();
        }
        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) request.get("ids");
        String nouveauRole = (String) request.get("nouveauRole");
        for (Integer id : ids) {
            userService.changeRole(Long.valueOf(id), nouveauRole);
        }
        return ResponseEntity.ok().build();
    }

    // PUT définir MDP
    @PutMapping("/set-password-admin")
    public ResponseEntity<Void> setPasswordAdmin(@RequestBody Map<String, String> request) {
        if (!securityUtils.hasPermission("DEFINIR_MDP_UTILISATEUR")) {
            return ResponseEntity.status(403).build();
        }
        Long id = Long.parseLong(request.get("id"));
        String mdp = request.get("nouveauMdp");
        userService.setPasswordById(id, mdp);
        return ResponseEntity.ok().build();
    }

    // PUT reset MDP (sur un seul, déjà existant dans UserController)
    // PUT forcer changement MDP (bulk)
    @PutMapping("/force-change-mdp-bulk")
    public ResponseEntity<Void> forceChangeMdpBulk(@RequestBody Map<String, Object> request) {
        if (!securityUtils.hasPermission("FORCER_CHANGEMENT_MDP")) {
            return ResponseEntity.status(403).build();
        }
        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) request.get("ids");
        for (Integer id : ids) {
            userService.forceChangeMdp(Long.valueOf(id));
        }
        return ResponseEntity.ok().build();
    }

    // PUT changer coordo (bulk)
    @PutMapping("/change-coordo-bulk")
    public ResponseEntity<Void> changeCoordoBulk(@RequestBody Map<String, Object> request) {
        if (!securityUtils.hasPermission("CHANGER_COORDINATRICE")) {
            return ResponseEntity.status(403).build();
        }
        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) request.get("ids");
        String newCoordoPrenom = (String) request.get("newCoordoPrenom");
        for (Integer id : ids) {
            userService.changeCoordinateur(Long.valueOf(id), newCoordoPrenom);
        }
        return ResponseEntity.ok().build();
    }

    // PUT retirer crèche (bulk)
    @PutMapping("/retirer-creche-bulk")
    public ResponseEntity<Void> retirerCrecheBulk(@RequestBody Map<String, Object> request) {
        if (!securityUtils.hasPermission("RETIRER_CRECHE")) {
            return ResponseEntity.status(403).build();
        }
        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) request.get("ids");
        for (Integer id : ids) {
            userService.retirerCreche(Long.valueOf(id));
        }
        return ResponseEntity.ok().build();
    }

}
