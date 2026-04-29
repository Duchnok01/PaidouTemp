@Service



public class UserService 
{
   
   
   
    private final UserRepository userRepository;




    public UserService(UserRepository userRepository) 
    {
        this.userRepository = userRepository;

    }





    public String createUser(String prenom) // cree un compte pour un nv directeur, et le rattache a ses creches.
    {
        
    } 






    public void fixNameTypo(String prenom, String nvPrenom) // édite les info utilisateurs
    {
        
    }  






    public void disableUser(String prenom) // desactive un compte directrice (supprime ses acces sans perdre l'information de son passage)
    {
        
    }  






    public void setPassword(String prenom, String passwd) // édite les info utilisateurs
    {
        
    } 









}