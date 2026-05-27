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
      await axios.post('/api/logs/undo', { logId: log.id }, { withCredentials: true });
      alert('Action annulée avec succès');
      fetchLogs();
    } catch (err) {
      console.error('Erreur annulation action', err);
    }
  };

  useEffect(() => {

    fetchLogs();
  }, []);

  return (
    <div className="page-container">
      <h1>Journal des actions</h1>
      <ul>
        {logs.map(log => (
          <li key={log.id}>
            <strong>{log.timestamp}</strong> - {log.user} a effectué l'action : {log.action}
            {log.details && <em>({log.details})</em>}
            <button onClick={() => handleUndo(log)}>Annuler</button>
          </li>
        ))}
      </ul>
    </div>
  );
};


export default Logs;
