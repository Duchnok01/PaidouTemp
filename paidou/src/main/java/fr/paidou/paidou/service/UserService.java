package fr.paidou.paidou.service;

import fr.paidou.paidou.model.User;
import fr.paidou.paidou.repository.UserRepository;
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
        newUser.setPrenom(prenom);
        String mdp = UUID.randomUUID().toString();
        newUser.setMdp(encoder.encode(mdp));
        userRepo.save(newUser);
        return mdp;
    } 






    public void fixNameTypo(String prenom, String nvPrenom) // édite les info utilisateurs
    {
        User user = userRepo.findByPrenom(prenom)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setPrenom(nvPrenom);
        userRepo.save(user);
    }  






    public void disableUserAccount(String prenom) // desactive un compte directrice (supprime ses acces sans perdre l'information de son passage)
    {
        User user = userRepo.findByPrenom(prenom)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setEstParti(true);
        userRepo.save(user);
    }  






    public void setPassword(String prenom, String passwd) // édite les info utilisateurs
    {
        User user = userRepo.findByPrenom(prenom)
                .orElseThrow(() -> new IllegalArgumentException("User introuvable pour prenom=" + prenom));
        user.setMdp(encoder.encode(passwd));
        userRepo.save(user);
    } 









}