package fr.paidou.paidou.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "vaccins")
public class Vaccin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom; // nom du vaccin

    @Column(nullable = false)
    private String maladiesPrevenues; // liste de maladies prevenues par le vaccin, séparées par des virgules

    @Column(nullable = true)
    private Integer pourEnfantsNesAvant; //Certains vaccins sont uniquement pour les enfants nés avant une certaine date

    @Column(nullable = true)
    private Integer pourEnfantsNesApres; //Certains vaccins sont uniquement pour les enfants nés après une certaine date

    @Column(nullable = false)
    private Integer agePremiereVaccination; // age de la premiere vaccination

    @Column(nullable = false)
    private Integer nbMoisPremierDelai; // nombre de mois entre la premiere et la deuxieme prise

    @Column(nullable = true)
    private Integer nbMoisDeuxiemeDelai; // nombre de mois entre la deuxieme et la troisieme prise, si il y en a une

    

}