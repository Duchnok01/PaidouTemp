package fr.paidou.paidou.controller.superadmin;

import fr.paidou.paidou.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/parametres")
public class ParametresController {

    private final SecurityUtils securityUtils;

    // Stockage en mémoire (à remplacer par une table plus tard si besoin)
    private final Map<String, Integer> parametres = new ConcurrentHashMap<>();

    public ParametresController(SecurityUtils securityUtils) {
        this.securityUtils = securityUtils;
        // Valeurs par défaut
        parametres.put("expirationMdp", 6);
        parametres.put("inactiviteMax", 12);
        parametres.put("seuilProche", 14);
        parametres.put("delaiRappel", 7);
    }

    @GetMapping
    public ResponseEntity<Map<String, Integer>> getParametres() {
        if (!securityUtils.hasPermission("VOIR_PARAMETRES")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(parametres);
    }

    @PutMapping
    public ResponseEntity<Void> updateParametres(@RequestBody Map<String, Integer> nouveaux) {
        if (!securityUtils.hasPermission("MODIFIER_PARAMETRES")) {
            return ResponseEntity.status(403).build();
        }
        if (nouveaux.containsKey("expirationMdp")) {
            int val = nouveaux.get("expirationMdp");
            if (val < 1 || val > 12) return ResponseEntity.badRequest().build();
            parametres.put("expirationMdp", val);
        }
        if (nouveaux.containsKey("inactiviteMax")) {
            int val = nouveaux.get("inactiviteMax");
            if (val < 1 || val > 24) return ResponseEntity.badRequest().build();
            parametres.put("inactiviteMax", val);
        }
        if (nouveaux.containsKey("seuilProche")) {
            int val = nouveaux.get("seuilProche");
            if (val < 7 || val > 30) return ResponseEntity.badRequest().build();
            parametres.put("seuilProche", val);
        }
        if (nouveaux.containsKey("delaiRappel")) {
            int val = nouveaux.get("delaiRappel");
            if (val < 1 || val > 30) return ResponseEntity.badRequest().build();
            parametres.put("delaiRappel", val);
        }
        return ResponseEntity.ok().build();
    }
}