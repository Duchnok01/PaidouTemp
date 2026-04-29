package fr.paidou.paidou.model;

import java.io.Serializable;
import java.time.LocalDate;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class EnregistrementVaccinationId implements Serializable {
    private Long idEnfant;
    private Long idVaccin;
    private LocalDate dateVaccination;
}