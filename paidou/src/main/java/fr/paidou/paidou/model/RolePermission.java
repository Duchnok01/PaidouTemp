package fr.paidou.paidou.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "role_permissions")
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String role;        // ex: "superadmin", "pdg", "coordinateur", "directrice"

    @ManyToOne
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;
}