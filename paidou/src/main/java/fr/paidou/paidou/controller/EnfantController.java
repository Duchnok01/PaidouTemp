package fr.paidou.paidou.controller;

import fr.paidou.paidou.service.EnfantService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/enfants")
public class EnfantController {

    private final EnfantService enfantService;

    public EnfantController(EnfantService enfantService) {
        this.enfantService = enfantService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> createEnfant(@RequestBody CreateEnfantRequest request) {
        enfantService.createEnfant(
                request.nom(),
                request.prenom(),
                request.dateDeNaissance(),
                request.nomCreche()
        );
        return ResponseEntity.ok().build();
    }

    @PutMapping("/change-creche")
    public ResponseEntity<Void> changeCreche(@RequestBody ChangeCrecheRequest request) {
        enfantService.changeCreche(request.id(), request.nomCreche());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/rectifier")
    public ResponseEntity<Void> rectifierInfos(@RequestBody RectifierInfosRequest request) {
        enfantService.rectifierInfos(
                request.id(),
                request.nom(),
                request.prenom(),
                request.dateDeNaissance()
        );
        return ResponseEntity.ok().build();
    }

    @PutMapping("/disable")
    public ResponseEntity<Void> disableChild(@RequestBody DisableChildRequest request) {
        enfantService.disableChildAccount(request.id());
        return ResponseEntity.ok().build();
    }

    // ================= DTOs =================

    public record CreateEnfantRequest(
            String nom,
            String prenom,
            LocalDate dateDeNaissance,
            String nomCreche
    ) {}

    public record ChangeCrecheRequest(
            Long id,
            String nomCreche
    ) {}

    public record RectifierInfosRequest(
            Long id,
            String nom,
            String prenom,
            LocalDate dateDeNaissance
    ) {}

    public record DisableChildRequest(Long id) {}
}