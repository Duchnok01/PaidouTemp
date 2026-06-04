package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Permission;
import fr.paidou.paidou.model.RolePermission;
import fr.paidou.paidou.repository.PermissionRepository;
import fr.paidou.paidou.repository.RolePermissionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    // Liste des 35 permissions avec leur description et catégorie
    private static final Map<String, String[]> ALL_PERMISSIONS = new LinkedHashMap<>();
    static {
        // Users
        ALL_PERMISSIONS.put("VOIR_TOUS_UTILISATEURS",     new String[]{"Voir la liste complète des utilisateurs", "users"});
        ALL_PERMISSIONS.put("CREER_UTILISATEUR",          new String[]{"Créer un nouvel utilisateur", "users"});
        ALL_PERMISSIONS.put("RENOMMER_UTILISATEUR",       new String[]{"Changer le prénom d'un utilisateur", "users"});
        ALL_PERMISSIONS.put("CHANGER_ROLE_UTILISATEUR",   new String[]{"Changer le rôle d'un utilisateur", "users"});
        ALL_PERMISSIONS.put("DEFINIR_MDP_UTILISATEUR",    new String[]{"Définir un mot de passe manuellement", "users"});
        ALL_PERMISSIONS.put("RESET_MDP_UTILISATEUR",      new String[]{"Réinitialiser le mot de passe (auto-généré)", "users"});
        ALL_PERMISSIONS.put("FORCER_CHANGEMENT_MDP",      new String[]{"Forcer le changement de MDP au prochain login", "users"});
        ALL_PERMISSIONS.put("DESACTIVER_UTILISATEUR",     new String[]{"Désactiver un utilisateur", "users"});
        ALL_PERMISSIONS.put("REACTIVER_UTILISATEUR",      new String[]{"Réactiver un utilisateur", "users"});
        ALL_PERMISSIONS.put("SUPPRIMER_UTILISATEUR",      new String[]{"Supprimer définitivement un utilisateur", "users"});
        ALL_PERMISSIONS.put("CHANGER_COORDINATRICE",      new String[]{"Assigner une coordinatrice à une directrice", "users"});
        ALL_PERMISSIONS.put("RETIRER_CRECHE",             new String[]{"Dissocier une directrice de sa crèche", "users"});
        ALL_PERMISSIONS.put("TRANSFERER_CRECHES",         new String[]{"Transférer toutes les crèches d'une directrice", "users"});

        // Creches
        ALL_PERMISSIONS.put("VOIR_TOUTES_CRECHES",        new String[]{"Voir toutes les crèches", "creches"});
        ALL_PERMISSIONS.put("CREER_CRECHE",               new String[]{"Créer une crèche", "creches"});
        ALL_PERMISSIONS.put("RENOMMER_CRECHE",            new String[]{"Renommer une crèche", "creches"});
        ALL_PERMISSIONS.put("CHANGER_DIRECTRICE",         new String[]{"Changer la directrice d'une crèche", "creches"});
        ALL_PERMISSIONS.put("FERMER_CRECHE",              new String[]{"Fermer une crèche", "creches"});
        ALL_PERMISSIONS.put("ROUVRIR_CRECHE",             new String[]{"Rouvrir une crèche", "creches"});
        ALL_PERMISSIONS.put("SUPPRIMER_CRECHE",           new String[]{"Supprimer définitivement une crèche", "creches"});
        ALL_PERMISSIONS.put("VOIR_ENFANTS_CRECHE",        new String[]{"Voir les enfants d'une crèche", "creches"});

        // Enfants
        ALL_PERMISSIONS.put("VOIR_TOUS_ENFANTS",          new String[]{"Voir tous les enfants de toutes les crèches", "enfants"});
        ALL_PERMISSIONS.put("CREER_ENFANT",               new String[]{"Créer un enfant", "enfants"});
        ALL_PERMISSIONS.put("MODIFIER_ENFANT",            new String[]{"Modifier les infos d'un enfant", "enfants"});
        ALL_PERMISSIONS.put("CHANGER_CRECHE_ENFANT",      new String[]{"Transférer un enfant vers une autre crèche", "enfants"});
        ALL_PERMISSIONS.put("DESACTIVER_ENFANT",          new String[]{"Désactiver un enfant", "enfants"});
        ALL_PERMISSIONS.put("REACTIVER_ENFANT",           new String[]{"Réactiver un enfant", "enfants"});
        ALL_PERMISSIONS.put("ANONYMISER_ENFANT",          new String[]{"Anonymiser un enfant (RGPD)", "enfants"});
        ALL_PERMISSIONS.put("SUPPRIMER_ENFANT",           new String[]{"Supprimer définitivement un enfant", "enfants"});

        // Vaccins
        ALL_PERMISSIONS.put("VOIR_TOUS_VACCINS",          new String[]{"Voir tous les vaccins (actifs et obsolètes)", "vaccins"});
        ALL_PERMISSIONS.put("CREER_VACCIN",               new String[]{"Créer un vaccin", "vaccins"});
        ALL_PERMISSIONS.put("MODIFIER_VACCIN",            new String[]{"Modifier un vaccin", "vaccins"});
        ALL_PERMISSIONS.put("RENDRE_OBSOLETE_VACCIN",     new String[]{"Rendre un vaccin obsolète", "vaccins"});
        ALL_PERMISSIONS.put("REACTIVER_VACCIN",           new String[]{"Réactiver un vaccin", "vaccins"});
        ALL_PERMISSIONS.put("SUPPRIMER_VACCIN",           new String[]{"Supprimer définitivement un vaccin", "vaccins"});

        // Enregistrements
        ALL_PERMISSIONS.put("VOIR_TOUS_ENREGISTREMENTS",  new String[]{"Voir tous les enregistrements de vaccination", "enregistrements"});
        ALL_PERMISSIONS.put("CREER_ENREGISTREMENT",       new String[]{"Ajouter un enregistrement de vaccination", "enregistrements"});
        ALL_PERMISSIONS.put("MODIFIER_ENREGISTREMENT",    new String[]{"Modifier un enregistrement de vaccination", "enregistrements"});
        ALL_PERMISSIONS.put("SUPPRIMER_ENREGISTREMENT",   new String[]{"Supprimer un enregistrement de vaccination", "enregistrements"});

        // Logs
        ALL_PERMISSIONS.put("VOIR_TOUS_LOGS",             new String[]{"Voir tous les logs", "logs"});
        ALL_PERMISSIONS.put("UNDO_ACTION",                new String[]{"Annuler une action", "logs"});

        // Paramètres
        ALL_PERMISSIONS.put("VOIR_PARAMETRES",            new String[]{"Voir les paramètres globaux", "parametres"});
        ALL_PERMISSIONS.put("MODIFIER_PARAMETRES",        new String[]{"Modifier les paramètres globaux", "parametres"});
    }

    public PermissionService(PermissionRepository permissionRepository,
                             RolePermissionRepository rolePermissionRepository) {
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    // Initialise les permissions en base au démarrage si elles n'existent pas
    @PostConstruct
    public void initPermissions() {
        for (Map.Entry<String, String[]> entry : ALL_PERMISSIONS.entrySet()) {
            String code = entry.getKey();
            String[] infos = entry.getValue();
            if (permissionRepository.findByCode(code).isEmpty()) {
                Permission p = new Permission();
                p.setCode(code);
                p.setDescription(infos[0]);
                p.setCategorie(infos[1]);
                permissionRepository.save(p);
            }
        }
    }

    // Récupère toutes les permissions
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    // Récupère les permissions d'un rôle
    public List<Permission> getPermissionsByRole(String role) {
        return rolePermissionRepository.findByRole(role).stream()
                .map(RolePermission::getPermission)
                .toList();
    }

    // Donne une permission à un rôle
    public void addPermissionToRole(String role, Long permissionId) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new IllegalArgumentException("Permission introuvable"));
        RolePermission rp = new RolePermission();
        rp.setRole(role);
        rp.setPermission(permission);
        rolePermissionRepository.save(rp);
    }

    // Retire une permission à un rôle
    public void removePermissionFromRole(String role, Long permissionId) {
        rolePermissionRepository.deleteByRoleAndPermissionId(role, permissionId);
    }

    // Initialise les permissions par défaut pour un rôle donné
    public void initDefaultPermissions(String role) {
        List<String> codes = switch (role) {
            case "superadmin" -> ALL_PERMISSIONS.keySet().stream().toList(); // Tout
            case "pdg" -> List.of(
                "VOIR_TOUS_UTILISATEURS", "CREER_UTILISATEUR", "RENOMMER_UTILISATEUR",
                "CHANGER_ROLE_UTILISATEUR", "DEFINIR_MDP_UTILISATEUR", "RESET_MDP_UTILISATEUR",
                "FORCER_CHANGEMENT_MDP", "DESACTIVER_UTILISATEUR", "REACTIVER_UTILISATEUR",
                "CHANGER_COORDINATRICE", "RETIRER_CRECHE", "TRANSFERER_CRECHES",
                "VOIR_TOUTES_CRECHES", "CREER_CRECHE", "RENOMMER_CRECHE",
                "CHANGER_DIRECTRICE", "FERMER_CRECHE", "ROUVRIR_CRECHE",
                "VOIR_ENFANTS_CRECHE", "VOIR_TOUS_ENFANTS", "CREER_ENFANT",
                "MODIFIER_ENFANT", "CHANGER_CRECHE_ENFANT", "DESACTIVER_ENFANT",
                "REACTIVER_ENFANT", "ANONYMISER_ENFANT",
                "VOIR_TOUS_VACCINS", "CREER_VACCIN", "MODIFIER_VACCIN",
                "RENDRE_OBSOLETE_VACCIN", "REACTIVER_VACCIN",
                "VOIR_TOUS_ENREGISTREMENTS", "CREER_ENREGISTREMENT",
                "MODIFIER_ENREGISTREMENT",
                "VOIR_TOUS_LOGS", "UNDO_ACTION",
                "VOIR_PARAMETRES"
            );
            case "coordinateur" -> List.of(
                "VOIR_ENFANTS_CRECHE", "VOIR_TOUS_ENFANTS",
                "CREER_ENFANT", "MODIFIER_ENFANT", "CHANGER_CRECHE_ENFANT",
                "DESACTIVER_ENFANT", "REACTIVER_ENFANT",
                "VOIR_TOUS_VACCINS",
                "CREER_ENREGISTREMENT", "MODIFIER_ENREGISTREMENT",
                "VOIR_TOUS_LOGS", "UNDO_ACTION"
            );
            case "directrice" -> List.of(
                "VOIR_ENFANTS_CRECHE",
                "CREER_ENFANT", "MODIFIER_ENFANT", "CHANGER_CRECHE_ENFANT",
                "DESACTIVER_ENFANT", "REACTIVER_ENFANT",
                "VOIR_TOUS_VACCINS",
                "CREER_ENREGISTREMENT", "MODIFIER_ENREGISTREMENT",
                "SUPPRIMER_ENREGISTREMENT",
                "VOIR_TOUS_LOGS", "UNDO_ACTION"
            );
            default -> List.of();
        };
        for (String code : codes) {
            Permission p = permissionRepository.findByCode(code).orElse(null);
            if (p != null) {
                addPermissionToRole(role, p.getId());
            }
        }
    }
}