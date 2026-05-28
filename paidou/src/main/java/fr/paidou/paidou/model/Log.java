package fr.paidou.paidou.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "logs")
public class Log {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;

    @Column(name = "id_user")
    private Long userId;

    @Column(name = "nom_creche")
    private String crecheNom;

    @Column(name = "id_enfant")
    private Long enfantId;

    @Column(name = "id_vaccin")
    private Long vaccinId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String details;
}