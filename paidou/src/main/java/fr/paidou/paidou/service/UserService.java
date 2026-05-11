package fr.paidou.paidou.service;

import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;

import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
   
   
   
    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder;



    public UserService(UserRepository uRep, BCryptPasswordEncoder bcpe) 
    {
        this.userRepo = uRep;
        this.encoder = bcpe;
        
    }





    public String createUser(String prenom) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
        User newUser = new User();
        newUser.setPrenom(prenom.toLowerCase());
        String mdp = UUID.randomUUID().toString();
        newUser.setMdp(encoder.encode(mdp));
        userRepo.save(newUser);
        return mdp;
    } 


    public User getUserByPrenom(String prenom) {
        return userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
    }



    public void fixNameTypo(String prenom, String nvPrenom) // édite les info utilisateurs
    {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setPrenom(nvPrenom.toLowerCase());
        userRepo.save(user);
    }  






    public void disableUserAccount(String prenom) // desactive un compte directrice (supprime ses acces sans perdre l'information de son passage)
    {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setEstParti(true);
        userRepo.save(user);
    }  


    public List<User> getAllUsers() {
        return userRepo.findAll();
    }



    public void setPassword(String prenom, String passwd) // édite les info utilisateurs
    {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setMdp(encoder.encode(passwd));
        userRepo.save(user);
    } 


    public Boolean verifyPassword(String prenom, String passwd) // vérifie si le mot de passe est correct
    {
        try {
        User user = userRepo.findByPrenom(prenom.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
            return encoder.matches(passwd, user.getMdp());
        } catch (Exception e) {
            System.out.println("Erreur lors de la vérification du mot de passe: " + e.getMessage());
            return null;
        }
    }



    public String[] getRedirectInfo(String prenom) { // renvoie un tableau de string contenant la page vers laquelle rediriger, le role de l'utilisateur, et son prenom 
        
        User user = this.getUserByPrenom(prenom.toLowerCase());

        return new String[] {user.isDoitChangerMdp()?"changer-mdp":user.getRole().equals("directrice")?"accueil":user.getRole(), user.getRole(), user.getPrenom()};  
        

    }






    



}