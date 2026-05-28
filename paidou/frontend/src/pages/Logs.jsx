import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Logs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/logs', { withCredentials: true });
      setLogs(res.data);
    } catch (err) {
      console.error('Erreur chargement logs', err);
    }
  };

  const handleUndo = async (log) => {
    if (log.action === 'DELETE_ENFANT') {
      alert("Impossible d'annuler la suppression définitive d'un enfant.");
      return;
    }
    try {
      await axios.post('/api/logs/undo', log.id, { withCredentials: true });
      alert('Action annulée avec succès');
      fetchLogs();
    } catch (err) {
      const message = err.response?.data || "Erreur lors de l'annulation";
      alert(message);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("fr-FR");
  };

  const isUndoable = (log) => {
    // Actions annulables (admin peut tout, directrice seulement certaines)
    const undoableActions = [
      "DESACTIVER_USER", "DESACTIVER_ENFANT", "FERMER_CRECHE",
      "RENDRE_OBSOLETE_VACCIN", "CHANGER_DIRECTEUR", "RECTIFIER_ENFANT",
      "TRANSFERER_ENFANT", "TRANSFERER_TOUS_ENFANTS", "CREER_VACCIN",
      "MODIFIER_VACCIN", "AJOUTER_ENREGISTREMENT"
    ];
    return undoableActions.includes(log.action);
  };

  return (
    <div className="page-container">
      <h1>Journal des actions</h1>
      {logs.length === 0 && <p className="text-secondary">Aucune entrée.</p>}
      <ul>
        {logs.map(log => (
          <li key={log.id}>
            <strong>{formatDate(log.timestamp)}</strong> - {log.user?.prenom || "?"} a effectué l'action : {log.action}
            {log.details && <em> ({log.details})</em>}
            {isUndoable(log) && (
              <button onClick={() => handleUndo(log)}>Annuler</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Logs;