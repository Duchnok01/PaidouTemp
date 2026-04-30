package fr.paidou.paidou.service;

import fr.paidou.paidou.model.EnregistrementVaccination;
import fr.paidou.paidou.model.EnregistrementVaccinationId;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.model.User;

import fr.paidou.paidou.repository.EnregistrementVaccinationRepository;
import fr.paidou.paidou.repository.EnfantRepository;
import fr.paidou.paidou.repository.VaccinRepository;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class EnregistrementVaccinationService 
{

        private final EnregistrementVaccinationRepository enregistrementRepo;
        private final EnfantRepository enfantRepo;
        private final VaccinRepository vaccinRepo;
        private final CrecheRepository crecheRepo;
        private final UserRepository userRepo;

        public EnregistrementVaccinationService
        (
                EnregistrementVaccinationRepository enregistrementRepo,
                EnfantRepository enfantRepo,
                VaccinRepository vaccinRepo,
                CrecheRepository crecheRepo,
                UserRepository userRepo
        ) 
        {
                this.enregistrementRepo = enregistrementRepo;
                this.enfantRepo = enfantRepo;
                this.vaccinRepo = vaccinRepo;
                this.crecheRepo = crecheRepo;
                this.userRepo = userRepo;
        }






        // =========================
        // CREATE
        // =========================
        public EnregistrementVaccination createEnregistrement(
                Long idEnfant,
                Long idVaccin,
                LocalDate dateVaccination,
                String nomCreche,
                Long idUser
        ) 
        {
                Enfant enfant = enfantRepo.findById(idEnfant)
                        .orElseThrow(() -> new IllegalArgumentException("Enfant introuvable"));

                Vaccin vaccin = vaccinRepo.findById(idVaccin)
                        .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));

                Creche creche = crecheRepo.findById(nomCreche)
                        .orElseThrow(() -> new IllegalArgumentException("Crèche introuvable"));

                User user = userRepo.findById(idUser)
                        .orElseThrow(() -> new IllegalArgumentException("User introuvable"));

                EnregistrementVaccinationId id = new EnregistrementVaccinationId();
                id.setIdEnfant(idEnfant);
                id.setIdVaccin(idVaccin);
                id.setDateVaccination(dateVaccination);

                EnregistrementVaccination ev = new EnregistrementVaccination();
                ev.setId(id);
                ev.setEnfant(enfant);
                ev.setVaccin(vaccin);
                ev.setCreche(creche);
                ev.setUser(user);

                return enregistrementRepo.save(ev);
        }




        // =========================
        // EDIT (sans changement de PK métier)
        // =========================
        public EnregistrementVaccination editEnregistrement
        (
                Long idEnfant,
                Long idVaccin,
                LocalDate ancienneDate,
                Long newIdVaccin,
                LocalDate nouvelleDate
        ) 
        {
                EnregistrementVaccinationId oldId = new EnregistrementVaccinationId();
                oldId.setIdEnfant(idEnfant);
                oldId.setIdVaccin(idVaccin);
                oldId.setDateVaccination(ancienneDate);

                EnregistrementVaccination ancien = enregistrementRepo.findById(oldId)
                        .orElseThrow(() -> new IllegalArgumentException("Enregistrement introuvable"));

                Vaccin newVaccin = vaccinRepo.findById(newIdVaccin)
                        .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));

                enregistrementRepo.delete(ancien);

                EnregistrementVaccinationId newId = new EnregistrementVaccinationId();
                newId.setIdEnfant(idEnfant);
                newId.setIdVaccin(newIdVaccin);
                newId.setDateVaccination(nouvelleDate);

                EnregistrementVaccination nouveau = new EnregistrementVaccination();
                nouveau.setId(newId);
                nouveau.setEnfant(ancien.getEnfant());
                nouveau.setVaccin(newVaccin);
                nouveau.setCreche(ancien.getCreche());
                nouveau.setUser(ancien.getUser());

                return enregistrementRepo.save(nouveau);
                }




        // =========================
        // DELETE
        // =========================
        public void deleteEnregistrement(
                Long idEnfant,
                Long idVaccin,
                LocalDate dateVaccination
        ) 
        {
                EnregistrementVaccinationId id = new EnregistrementVaccinationId();
                id.setIdEnfant(idEnfant);
                id.setIdVaccin(idVaccin);
                id.setDateVaccination(dateVaccination);

                EnregistrementVaccination enregistrement = enregistrementRepo.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Enregistrement introuvable"));

                enregistrementRepo.delete(enregistrement);
        }




}