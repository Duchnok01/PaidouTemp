package fr.paidou.paidou.controller;

import fr.paidou.paidou.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

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

    public record PrenomRequest(String prenom) {
    }
}

