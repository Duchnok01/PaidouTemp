package fr.paidou.paidou.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate; 

@Data
@Entity
@Table(name = "enregistrement_vaccinations")
public class EnregistrementVaccination {

    @EmbeddedId
    private EnregistrementVaccinationId id; // id de l'enregistrement de vaccination

    @ManyToOne
    @MapsId("idEnfant") // "idEnfant" = le nom du champ dans EnregistrementVaccinationId
    @JoinColumn(name = "id_enfant")
    private Enfant enfant;

    @ManyToOne
    @MapsId("idVaccin")
    @JoinColumn(name = "id_vaccin")
    private Vaccin vaccin;

    @ManyToOne
    @JoinColumn(name = "id_creche", nullable = false)
    private Creche creche;

    @ManyToOne
    @JoinColumn(name = "id_user", nullable = false)
    private User user;
    
    @MapsId("dateVaccination")
    private LocalDate dateVaccination;

    


}