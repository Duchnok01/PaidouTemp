package fr.paidou.paidou.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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