package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRole(String role);
    void deleteByRoleAndPermissionId(String role, Long permissionId);
}