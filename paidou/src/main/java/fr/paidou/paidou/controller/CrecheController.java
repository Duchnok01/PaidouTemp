package fr.paidou.paidou.controller;

import fr.paidou.paidou.service.CrecheService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/creches")
public class CrecheController {

    private final CrecheService crecheService;

    public CrecheController(CrecheService crecheService) {
        this.crecheService = crecheService;
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

    public record CreateCrecheRequest(String nom, String directeur) {}

    public record ChangeDirecteurRequest(String nom, String directeur) {}
}