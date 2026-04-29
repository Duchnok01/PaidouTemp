
package fr.paidou.paidou.service;

import fr.paidou.paidou.model.Creche;
import fr.paidou.paidou.repository.CrecheRepository;
import org.springframework.stereotype.Service;
import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;

@Service
public class CrecheService {
   
   
   
    private final CrecheRepository crecheRepo;
    private final UserRepository userRepo;



    public CrecheService(CrecheRepository cRep, UserRepository uRep) 
    {
        this.crecheRepo = cRep;
        this.userRepo = uRep;

    }





    public void createCreche(String nom, String directeur) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
        Creche newCreche = new Creche();
        newCreche.setNom(nom);
        User dir = this.userRepo.findByPrenom(directeur).orElseThrow(() -> new IllegalArgumentException("Directeur introuvable pour le prenom: \"" + directeur + "\". l'avez vous bien écrit?"));
        newCreche.setDirecteur(dir);
        crecheRepo.save(newCreche);
    } 


    public void changeDirecteur(String nom, String directeur) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
        Creche c = this.crecheRepo.findById(nom).orElseThrow(() -> new IllegalArgumentException("Creche introuvable pour cet identifiant: \"" + nom + "\". Modification impossible"));
        User dir = this.userRepo.findByPrenom(directeur).orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + directeur + "Assignation a la creche impossible"));
        c.setDirecteur(dir);
        crecheRepo.save(c);
    } 








}