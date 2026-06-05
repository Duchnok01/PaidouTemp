import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, useRedirectByRole } from '../context/AuthContext';

const Logs = () => {
  const { effectiveUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [highlightedLogId, setHighlightedLogId] = useState(null);

  const fetchLogs = async (q) => {
    try {
      const params = q ? { q } : {};
      const res = await axios.get('/api/logs', { params, withCredentials: true });
      setLogs(res.data);
    } catch (err) {
      console.error('Erreur chargement logs', err);
    }
  };

  useEffect(() => {
    if (!effectiveUser) return;
    fetchLogs();
  }, [effectiveUser]);

  const findUndoLog = (log) => {
    return logs.find(l => l.action === "UNDO_" + log.action && l.details && l.details.includes("logId=" + log.id));
  };

  const handleUndo = async (log) => {
    if (log.action === 'DELETE_ENFANT') {
      alert("Impossible d'annuler la suppression définitive d'un enfant.");
      return;
    }
    try {
      await axios.post('/api/logs/undo', log.id, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      alert('Action annulée avec succès');
      fetchLogs(search || undefined);
    } catch (err) {
      const data = err.response?.data;
      let message = typeof data === 'string' ? data : (data?.message || data?.error || "Erreur lors de l'annulation");
      if (message.includes("contient encore des enfants")) {
        message = "Impossible d'annuler : la crèche contient encore des enfants. Transférez-les d'abord.";
      } else if (message.includes("utilisé dans")) {
        message = "Impossible d'annuler : ce vaccin est encore utilisé dans des enregistrements.";
      } else if (message.includes("Action non annulable")) {
        message = "Cette action ne peut pas être annulée.";
      } else if (message.includes("pas annulable par une directrice")) {
        message = "Vous n'avez pas les droits pour annuler cette action.";
      }
      alert(message);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("fr-FR");
  };

  const isUndoable = (log) => {
    if (log.action.startsWith("UNDO_") || log.action.startsWith("REACTIVER_")) return false;
    if (findUndoLog(log)) return false;
    const undoableActions = [
      "DESACTIVER_USER", "DESACTIVER_ENFANT", "FERMER_CRECHE",
      "RENDRE_OBSOLETE_VACCIN", "CHANGER_DIRECTEUR", "RECTIFIER_ENFANT",
      "TRANSFERER_ENFANT", "TRANSFERER_TOUS_ENFANTS", "CREER_VACCIN",
      "MODIFIER_VACCIN", "AJOUTER_ENREGISTREMENT"
    ];
    return undoableActions.includes(log.action);
  };

  const scrollToLog = (logId) => {
    setHighlightedLogId(logId);
    document.getElementById("log-" + logId)?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => setHighlightedLogId(null), 3000);
  };

  const handleSearch = () => {
    fetchLogs(search || undefined);
  };

  return (
    <div className="page-container">
      <h1>Journal des actions</h1>
      
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch}>🔍</button>
        {search && (
          <button className="btn btn-secondary" onClick={() => { setSearch(''); fetchLogs(); }}>
            ✖
          </button>
        )}
      </div>

      {logs.length === 0 && <p className="text-secondary">Aucune entrée.</p>}
      <ul>
        {logs.map(log => {
          const undoLog = findUndoLog(log);
          return (
            <li
              key={log.id}
              id={"log-" + log.id}
              className={highlightedLogId === log.id ? "log-highlight" : ""}
            >
              <strong>{formatDate(log.timestamp)}</strong> - {log.userPrenom || "Utilisateur inconnu"} a effectué l'action : {log.action}
              {log.details && <em> ({log.details})</em>}
              {isUndoable(log) && (
                <button onClick={() => handleUndo(log)}>Annuler</button>
              )}
              {undoLog && (
                <button onClick={() => scrollToLog(undoLog.id)}>Voir l'annulation</button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Logs;