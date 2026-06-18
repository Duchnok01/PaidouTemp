import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Logs = () => {
  const { effectiveUser } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [highlightedLogId, setHighlightedLogId] = useState(null);

  const fetchLogs = async (q) => {
    try {
      const params = q ? { q } : {};
      const res = await axios.get("/api/logs", { params, withCredentials: true });
      setLogs(res.data);
    } catch (err) {
      console.error("Erreur chargement logs", err);
    }
  };

  useEffect(() => {
    if (!effectiveUser) return;
    fetchLogs();
  }, [effectiveUser]);

  const findUndoLog = (log) =>
    logs.find((l) => l.action === "UNDO_" + log.action && l.details?.includes("logId=" + log.id));

  const handleUndo = async (log) => {
    if (!log.canUndo) return;
    try {
      await axios.post("/api/logs/undo", log.id, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      fetchLogs(search || undefined);
    } catch (err) {
      const data = err.response?.data;
      alert(typeof data === "string" ? data : data?.message || data?.error || "Erreur lors de l'annulation");
    }
  };

  const scrollToLog = (logId) => {
    setHighlightedLogId(logId);
    document.getElementById("log-" + logId)?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => setHighlightedLogId(null), 3000);
  };

  const handleSearch = () => fetchLogs(search || undefined);

  return (
    <div className="page-container">
      <h1>Journal des actions</h1>

      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch}>Rechercher</button>
        {search && (
          <button className="btn btn-secondary" onClick={() => { setSearch(""); fetchLogs(); }}>
            Effacer
          </button>
        )}
      </div>

      {logs.length === 0 && <p className="text-secondary">Aucune entrée.</p>}

      {logs.length > 0 && (
        <table className="table logs-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Événement</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const undoLog = findUndoLog(log);
              return (
                <tr
                  key={log.id}
                  id={"log-" + log.id}
                  className={highlightedLogId === log.id ? "log-highlight" : ""}
                >
                  <td className="logs-action-cell">
                    <button
                      className={`btn btn-sm log-undo-btn ${log.canUndo ? "" : "log-undo-btn-disabled"}`}
                      onClick={() => handleUndo(log)}
                      disabled={!log.canUndo}
                      title={log.canUndo ? "Annuler cette action" : log.undoUnavailableReason || "Action non annulable"}
                    >
                      Annuler
                    </button>
                    {log.undoAlternativePath && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(log.undoAlternativePath)}
                      >
                        {log.undoAlternativeLabel || "Alternative"}
                      </button>
                    )}
                    {undoLog && (
                      <button className="btn btn-sm btn-secondary" onClick={() => scrollToLog(undoLog.id)}>
                        Voir
                      </button>
                    )}
                  </td>
                  <td>{new Date(log.timestamp).toLocaleString("fr-FR")}</td>
                  <td>{log.userPrenom || "Utilisateur inconnu"}</td>
                  <td>
                    <strong>{log.action}</strong>
                    {log.crecheNom && <div className="text-secondary">{log.crecheNom}</div>}
                    {(log.enfantPrenom || log.enfantNom) && (
                      <div className="text-secondary">{log.enfantPrenom} {log.enfantNom}</div>
                    )}
                    {log.vaccinNom && <div className="text-secondary">{log.vaccinNom}</div>}
                  </td>
                  <td>{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Logs;
