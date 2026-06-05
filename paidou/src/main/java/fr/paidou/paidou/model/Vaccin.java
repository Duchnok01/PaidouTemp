package fr.paidou.paidou.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "vaccins")
public class Vaccin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String maladiesPrevenues;

    @Column(name = "ne_avant_le")
    private LocalDate neAvantLe;

    @Column(name = "ne_apres_le")
    private LocalDate neApresLe;

    @Column(nullable = false)
    private Integer agePremiereVaccination;

    @Column(nullable = false)
    private Integer nbMoisPremierDelai;

    @Column(nullable = true)
    private Integer nbMoisDeuxiemeDelai;

    @Column(nullable = false)
    private boolean estObsolete = false;
}