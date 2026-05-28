Revue des appels à logService.log() dans les services

Synthèse:
- Constructeurs: Aucun appel à logService.log() dans les constructeurs de UserService, CrecheService, VaccinService, EnfantService. OK.
- Portée des variables: Un problème détecté dans EnfantService.createEnfant.
- Appels après un throw: Aucun appel à logService.log() n’apparaît après une instruction throw, y compris dans CrecheService. OK.

Détails par fichier:

1) paidou/src/main/java/fr/paidou/paidou/service/UserService.java
- Constructeur: OK (aucun appel log).
- Portée: Tous les appels utilisent des variables en portée (fields ou paramètres). OK.
- Après throw: Aucun appel après un throw. OK.

2) paidou/src/main/java/fr/paidou/paidou/service/CrecheService.java
- Constructeur: OK (aucun appel log).
- Portée: Tous les appels utilisent des variables en portée. OK.
- Après throw: Aucun appel après un throw (y compris le cas spécifique demandé). OK.

3) paidou/src/main/java/fr/paidou/paidou/service/VaccinService.java
- Constructeur: OK (aucun appel log).
- Portée: Tous les appels utilisent des variables en portée. OK.
- Après throw: Aucun appel après un throw. OK.

4) paidou/src/main/java/fr/paidou/paidou/service/EnfantService.java
- Constructeur: OK (aucun appel log).
- Portée: PROBLÈME détecté dans createEnfant:
  - Appel: logService.log("TRANSFERER_ENFANT", securityUtils.getCurrentUser().getPrenom(), "id=" + id + " → " + nomCreche);
  - Problème: la variable id n’est pas définie dans la portée de createEnfant. Cet appel viole la contrainte "utiliser uniquement des variables en portée".
- Les autres appels utilisent des variables en portée. OK.
- Après throw: Aucun appel après un throw. OK.
