package fr.paidou.paidou.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDate;

@Data
@Embeddable
public class EnregistrementVaccinationId implements Serializable {
    private Long idEnfant;
    private Long idVaccin;
    private LocalDate dateVaccination;
}