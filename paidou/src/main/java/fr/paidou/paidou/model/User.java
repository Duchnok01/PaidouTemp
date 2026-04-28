package fr.paidou.paidou.model;

import jakarta.persistence.*;
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

}