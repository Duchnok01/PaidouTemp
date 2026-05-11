package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.repository.VaccinRepository;
import fr.paidou.paidou.security.SecurityUtils;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class VaccinService {

    private final VaccinRepository vaccinRepo;
    private final SecurityUtils securityUtils;

    public VaccinService(VaccinRepository vRep, SecurityUtils securityUtils) {
        this.vaccinRepo = vRep;
        this.securityUtils = securityUtils;
    }

    public void createVaccin(String nom, String listeMaladies, Integer pourEnfantsNesAvant,
                             Integer pourEnfantsNesApres, Integer agePremiereVaccination,
                             Integer nbMoisPremierDelai, Integer nbMoisDeuxiemeDelai) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut créer un vaccin");
        }

        Vaccin newV = new Vaccin();
        newV.setNom(nom);
        newV.setMaladiesPrevenues(listeMaladies);
        newV.setPourEnfantsNesAvant(pourEnfantsNesAvant);
        newV.setPourEnfantsNesApres(pourEnfantsNesApres);
        newV.setAgePremiereVaccination(agePremiereVaccination);
        newV.setNbMoisPremierDelai(nbMoisPremierDelai);
        newV.setNbMoisDeuxiemeDelai(nbMoisDeuxiemeDelai);
        vaccinRepo.save(newV);
    }




    public List<Vaccin> getAllVaccins() {
        return vaccinRepo.findAll();
    }









    public void editVaccin(Long id, String nom, String listeMaladies, Integer pourEnfantsNesAvant,
                           Integer pourEnfantsNesApres, Integer agePremiereVaccination,
                           Integer nbMoisPremierDelai, Integer nbMoisDeuxiemeDelai) {
        if (!securityUtils.isAdmin()) {
            throw new SecurityException("Seul un administrateur peut modifier un vaccin");
        }
        

        Vaccin newV = vaccinRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable"));
        newV.setNom(nom);
        newV.setMaladiesPrevenues(listeMaladies);
        newV.setPourEnfantsNesAvant(pourEnfantsNesAvant);
        newV.setPourEnfantsNesApres(pourEnfantsNesApres);
        newV.setAgePremiereVaccination(agePremiereVaccination);
        newV.setNbMoisPremierDelai(nbMoisPremierDelai);
        newV.setNbMoisDeuxiemeDelai(nbMoisDeuxiemeDelai);
        vaccinRepo.save(newV);
    }
}