import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Logs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

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
    fetchLogs();
  }, []);

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
      const message = typeof data === 'string' ? data : (data?.message || data?.error || "Erreur lors de l'annulation");
      alert(message);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("fr-FR");
  };

  const isUndoable = (log) => {
    const undoableActions = [
      "DESACTIVER_USER", "DESACTIVER_ENFANT", "FERMER_CRECHE",
      "RENDRE_OBSOLETE_VACCIN", "CHANGER_DIRECTEUR", "RECTIFIER_ENFANT",
      "TRANSFERER_ENFANT", "TRANSFERER_TOUS_ENFANTS", "CREER_VACCIN",
      "MODIFIER_VACCIN", "AJOUTER_ENREGISTREMENT"
    ];
    return undoableActions.includes(log.action);
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