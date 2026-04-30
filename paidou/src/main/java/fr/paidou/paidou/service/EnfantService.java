
package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.repository.CrecheRepository;
import fr.paidou.paidou.model.Enfant;
import fr.paidou.paidou.repository.EnfantRepository;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

@Service
public class EnfantService {
   
   
   
    private final CrecheRepository crecheRepo;
    private final EnfantRepository enfantRepo;



    public EnfantService(CrecheRepository cRep, EnfantRepository eRep) 
    {
        this.crecheRepo = cRep;
        this.enfantRepo = eRep;

    }





    public void createEnfant(String nom, String prenom, LocalDate birth, String nomCreche) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
        Creche c = this.crecheRepo.findById(nomCreche).orElseThrow(() -> new IllegalArgumentException("Creche introuvable pour cet identifiant: \"" + nomCreche + "\". Assignation impossible"));
        Enfant child = new Enfant();
        child.setPrenom(prenom);
        child.setNom(nom);
        child.setDateDeNaissance(birth);
        child.setCreche(c);
        enfantRepo.save(child);
        
    } 


    public void changeCreche(Long id, String nomCreche) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
        Creche c = this.crecheRepo.findById(nomCreche).orElseThrow(() -> new IllegalArgumentException("Creche introuvable pour cet identifiant: \"" + nomCreche + "\". Modification impossible"));
        Enfant child = this.enfantRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Enfant introuvable, erreur Systeme. Veuillez recharger la page, puis reessayer."));
        child.setCreche(c);
        enfantRepo.save(child);
    } 


    public void rectifierInfos(Long id, String nom, String prenom, LocalDate birth) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
        Enfant child = this.enfantRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Enfant introuvable, erreur Systeme. Veuillez recharger la page, puis reessayer."));
        child.setPrenom(prenom);
        child.setNom(nom);
        child.setDateDeNaissance(birth);
        enfantRepo.save(child);
    } 


    public void disableChildAccount(Long id) // desactive un compte enfant (le cache de la creche sans perdre l'information de son passage)
    {
        Enfant child = this.enfantRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Enfant introuvable, erreur Systeme. Veuillez recharger la page, puis reessayer."));
        child.setEstParti(true);
        enfantRepo.save(child);
    }  


}