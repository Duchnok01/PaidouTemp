package fr.paidou.paidou.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "creches")
public class Creche {

    @Id
    private String nom;

    @ManyToOne
    @JoinColumn(name = "id_directeur", nullable = false)
    private User directeur;


}