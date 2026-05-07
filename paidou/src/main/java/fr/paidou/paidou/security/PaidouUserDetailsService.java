package fr.paidou.paidou.security;

import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class PaidouUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // Injection par constructeur
    public PaidouUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String prenom) throws UsernameNotFoundException {

        User user = userRepository.findByPrenom(prenom)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable"));

        if (user.isEstParti()) {
            throw new UsernameNotFoundException("Utilisateur désactivé");
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getPrenom())
                .password(user.getMdp())
                .roles(user.getRole())
                .build();
    }
}