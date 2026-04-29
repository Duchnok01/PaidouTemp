package fr.paidou.paidou.model;

import java.time.LocalDate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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