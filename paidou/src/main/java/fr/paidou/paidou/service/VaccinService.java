package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Vaccin;
import fr.paidou.paidou.repository.VaccinRepository;
import org.springframework.stereotype.Service;

@Service
public class VaccinService {
   
   
   
    private final VaccinRepository vaccinRepo;



    public VaccinService(VaccinRepository vRep) 
    {
        this.vaccinRepo = vRep;

    }





    public void createVaccin(String nom, String listeMaladies, Integer pourEnfantsNesAvant, Integer pourEnfantsNesApres, Integer agePremiereVaccination, Integer nbMoisPremierDelai, Integer nbMoisDeuxiemeDelai) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
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


    public void editVaccin(Long id, String nom, String listeMaladies, Integer pourEnfantsNesAvant, Integer pourEnfantsNesApres, Integer agePremiereVaccination, Integer nbMoisPremierDelai, Integer nbMoisDeuxiemeDelai) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
        Vaccin newV = vaccinRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Vaccin introuvable, erreur requete BDD (fr.paidou.paidou.java.service.VaccinService.editVaccin()"));
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