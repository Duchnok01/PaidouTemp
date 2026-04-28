package fr.paidou.paidou.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "enfants")
public class Enfant {

    @Id
    private Long id_enfant;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private LocalDate dateDeNaissance;
    
    @ManyToOne
    @JoinColumn(name = "nom_creche", nullable = false)
    private Creche creche;
    
    @Column(nullable = false)
    private boolean estParti = false;

}