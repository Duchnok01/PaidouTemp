package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPrenom(String prenom);
    List<User> findByCoordinateurId(Long id);
    boolean existsByCoordinateurId(Long id);
}
