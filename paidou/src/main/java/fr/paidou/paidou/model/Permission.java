package fr.paidou.paidou.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;        // ex: "CREER_UTILISATEUR", "SUPPRIMER_ENFANT"

    @Column(nullable = false)
    private String description; // ex: "Créer un nouvel utilisateur"

    @Column(nullable = false)
    private String categorie;   // ex: "users", "creches", "enfants", "vaccins", "enregistrements", "logs", "parametres"
}