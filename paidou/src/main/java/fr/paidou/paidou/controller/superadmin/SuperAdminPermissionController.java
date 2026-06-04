package fr.paidou.paidou.controller.superadmin;

import fr.paidou.paidou.model.Permission;
import fr.paidou.paidou.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/superadmin/permissions")
public class SuperAdminPermissionController {

    private final PermissionService permissionService;

    public SuperAdminPermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @GetMapping
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    @GetMapping("/{role}")
    public ResponseEntity<List<Permission>> getPermissionsByRole(@PathVariable String role) {
        return ResponseEntity.ok(permissionService.getPermissionsByRole(role));
    }

    @PostMapping("/{role}/{permissionId}")
    public ResponseEntity<Void> addPermissionToRole(@PathVariable String role,
                                                     @PathVariable Long permissionId) {
        permissionService.addPermissionToRole(role, permissionId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{role}/{permissionId}")
    public ResponseEntity<Void> removePermissionFromRole(@PathVariable String role,
                                                          @PathVariable Long permissionId) {
        permissionService.removePermissionFromRole(role, permissionId);
        return ResponseEntity.ok().build();
    }
}