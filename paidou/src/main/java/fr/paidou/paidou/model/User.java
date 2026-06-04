package fr.paidou.paidou.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String prenom;

    @Column(nullable = false)
    private String mdp;

    @Column(nullable = false)
    private boolean estParti = false;

    @Column(nullable = false)
    private boolean doitChangerMdp = true;

    @Column(nullable = false)
    private String role = "directrice";

    @ManyToOne
    @JoinColumn(name = "id_coordinateur")
    @JsonIgnoreProperties({"coordinateur", "mdp"})
    private User coordinateur;
}