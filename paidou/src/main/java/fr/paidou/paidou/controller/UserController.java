package fr.paidou.paidou.controller;

import fr.paidou.paidou.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public String createUser(@RequestBody PrenomRequest request) {
        return userService.createUser(request.prenom());
    }

    @PutMapping("/fix-typo")
    public ResponseEntity<Void> fixTypo(@RequestBody FixTypoRequest request) {
        userService.fixNameTypo(request.ancienPrenom(), request.nouveauPrenom());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/disable")
    public ResponseEntity<Void> disableUser(@RequestBody DisableRequest request) {
        userService.disableUserAccount(request.prenom());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/set-password")
    public ResponseEntity<Void> setPassword(@RequestBody SetPasswordRequest request) {
        userService.setPassword(request.prenom(), request.nouveauMdp());
        return ResponseEntity.ok().build();
    }

    public record PrenomRequest(String prenom) {}

    public record FixTypoRequest(String ancienPrenom, String nouveauPrenom) {}

    public record DisableRequest(String prenom) {}

    public record SetPasswordRequest(String prenom, String nouveauMdp) {}
}