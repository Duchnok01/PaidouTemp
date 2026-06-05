package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRole(String role);
    @Modifying
    @Transactional
    @Query("DELETE FROM RolePermission rp WHERE rp.role = :role AND rp.permission.id = :permissionId")
    void deleteByRoleAndPermissionId(String role, Long permissionId);
}