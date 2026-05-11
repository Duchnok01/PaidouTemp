package fr.paidou.paidou.controller;

import fr.paidou.paidou.security.SecurityUtils;
import fr.paidou.paidou.service.CrecheService;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/creches")
public class CrecheController {

    private final CrecheService crecheService;
    private final SecurityUtils securityUtils; 

    public CrecheController(CrecheService crecheService, SecurityUtils securityUtils){
        this.crecheService = crecheService;
        this.securityUtils = securityUtils; 
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> createCreche(@RequestBody CreateCrecheRequest request) {
        crecheService.createCreche(request.nom(), request.directeur());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/change-directeur")
    public ResponseEntity<Void> changeDirecteur(@RequestBody ChangeDirecteurRequest request) {
        crecheService.changeDirecteur(request.nom(), request.directeur());
        return ResponseEntity.ok().build();
    }


    @GetMapping
    public ResponseEntity<List<CrecheSummaryDTO>> getAllCreches() {
        try {
            if (!securityUtils.isAdmin()) {
                return ResponseEntity.status(403).build();
            }
            List<CrecheSummaryDTO> creches = crecheService.getAllCreches().stream()
                    .map(c -> new CrecheSummaryDTO(
                            c.getNom(),
                            c.getDirecteur().getPrenom()
                    ))
                    .toList();
            return ResponseEntity.ok(creches);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }





    @GetMapping("/mes-creches")
    public ResponseEntity<List<CrecheSummaryDTO>> getMesCreches() {
        try {
            List<CrecheSummaryDTO> creches = crecheService.getMesCreches().stream()
                    .map(c -> new CrecheSummaryDTO(
                            c.getNom(),
                            c.getDirecteur().getPrenom()
                    ))
                    .toList();
            return ResponseEntity.ok(creches);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }








    public record CreateCrecheRequest(String nom, String directeur) {}

    public record ChangeDirecteurRequest(String nom, String directeur) {}

    public record CrecheSummaryDTO(String nom, String directeurPrenom) {}
}