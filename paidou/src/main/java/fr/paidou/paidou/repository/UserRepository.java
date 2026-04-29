package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPrenom(String prenom);
}