package fr.paidou.paidou.repository;

import fr.paidou.paidou.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LogRepository extends JpaRepository<Log, Long> {

    List<Log> findByUser(String user);

    /**
     * Pour une directrice : ses propres logs + les logs liés à une de ses crèches.
     */
    @Query("SELECT l FROM Log l LEFT JOIN l.creche c " +
           "WHERE l.user.prenom = :prenom OR c.directeur.id = :directeurId")
    List<Log> findByUserOrCrecheDirecteur(@Param("prenom") String prenom,
                                          @Param("directeurId") Long directeurId);
}