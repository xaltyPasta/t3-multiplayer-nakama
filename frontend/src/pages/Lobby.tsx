import { useState, useEffect, useCallback } from 'react';
import { findMatch, listMatches, joinMatch, createMatch } from '../services/nakama';
import type { GameMode } from '../store/gameStore';

interface LobbyProps {
  onChangeName?: () => void;
}

export default function Lobby({ onChangeName }: LobbyProps) {
  const [finding, setFinding] = useState(false);
  const [mode, setMode] = useState<GameMode>("classic");
  const [elapsed, setElapsed] = useState(0);
  const [joinId, setJoinId] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"find" | "browse" | "create">("find");

  // Refresh match list when on browse tab
  const refreshMatches = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const result = await listMatches();
      setMatches(result || []);
    } catch {
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "browse") {
      refreshMatches();
      const interval = setInterval(refreshMatches, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, refreshMatches]);

  // Elapsed timer for matchmaking
  useEffect(() => {
    let interval: any;
    if (finding) {
      interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [finding]);

  const handleFindRandom = async () => {
    setFinding(true);
    try {
      await findMatch(mode);
      setFinding(false);
    } catch {
      alert("Matchmaking failed or was cancelled.");
      setFinding(false);
    }
  };

  const handleJoinById = async () => {
    const id = joinId.trim();
    if (!id) return;
    setJoiningId(id);
    try {
      await joinMatch(id);
    } catch {
      alert("Could not join match. Check the ID and try again.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    setJoiningId(matchId);
    try {
      await joinMatch(matchId);
    } catch {
      alert("Failed to join match.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateMatch = async () => {
    try {
      const matchId = await createMatch(mode);
      if (!matchId) throw new Error("Match creation failed");
    } catch (err: any) {
      alert(`Failed to create match: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setFinding(false);
    window.location.reload();
  };

  // -- Finding screen --
  if (finding) {
    return (
      <div className="d-flex flex-column h-100 p-4 align-items-center justify-content-center text-center animate-fade-in">
        <div className="spinner mb-4"></div>
        <h5 className="fw-semibold mb-2">Finding a match...</h5>
        <p className="text-muted small mb-1">Mode: <strong>{mode}</strong></p>
        <p className="text-muted small mb-4">
          Elapsed: {elapsed}s
        </p>
        <button className="btn-outline px-4 py-2" style={{fontSize: '14px'}} onClick={handleCancel}>
          Cancel
        </button>
      </div>
    );
  }

  // -- Lobby --
  return (
    <div className="d-flex flex-column h-100 p-4 animate-fade-in" style={{gap: '1rem'}}>
      {/* Header */}
      <div className="text-center pt-2 pb-1 position-relative">
        <h4 className="fw-bold mb-1">Tic-Tac-Toe</h4>
        <p className="text-muted small mb-0">Multiplayer · Server-Authoritative</p>
        
        {onChangeName && (
          <button 
            onClick={onChangeName}
            className="btn-link position-absolute" 
            style={{top: '10px', right: '0px', fontSize: '11px', color: 'var(--accent-green)', opacity: 0.8}}
          >
            ✎ Change Name
          </button>
        )}
      </div>

      {/* Mode Selector */}
      <div>
        <label className="fw-semibold small text-muted d-block mb-2">Game Mode</label>
        <div className="tab-group">
          <button className={`tab ${mode === 'classic' ? 'active' : ''}`} onClick={() => setMode('classic')}>
            ♟ Classic
          </button>
          <button className={`tab ${mode === 'timed' ? 'active' : ''}`} onClick={() => setMode('timed')}>
            ⏱ Timed (30s)
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-group">
        <button className={`tab ${activeTab === 'find' ? 'active' : ''}`} onClick={() => setActiveTab('find')}>
          Auto Match
        </button>
        <button className={`tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
          Browse
        </button>
        <button className={`tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          Create
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{minHeight: 0}}>

        {/* --- Auto Match Tab --- */}
        {activeTab === "find" && (
          <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center animate-fade-in">
            <p className="text-muted small mb-3">
              Automatically find an opponent playing <strong>{mode}</strong> mode
            </p>
            <button className="btn-primary w-100 py-3" style={{fontSize: '15px', maxWidth: '300px'}} onClick={handleFindRandom}>
              Find Random Player
            </button>
          </div>
        )}

        {/* --- Browse Tab --- */}
        {activeTab === "browse" && (
          <div className="d-flex flex-column flex-grow-1 animate-fade-in" style={{gap: '0.75rem'}}>
            {/* Join by ID */}
            <div>
              <label className="fw-semibold small text-muted d-block mb-1">Join by Match ID</label>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="input-minimal flex-grow-1"
                  placeholder="Paste match ID..."
                  value={joinId}
                  onChange={e => setJoinId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoinById()}
                />
                <button
                  className="btn-primary px-3"
                  style={{fontSize: '13px', whiteSpace: 'nowrap'}}
                  onClick={handleJoinById}
                  disabled={!joinId.trim() || !!joiningId}
                >
                  Join
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* Match List */}
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="fw-semibold small text-muted">Open Matches</span>
              <button
                className="btn-outline px-2 py-1"
                style={{fontSize: '11px'}}
                onClick={refreshMatches}
                disabled={loadingMatches}
              >
                {loadingMatches ? "..." : "↻ Refresh"}
              </button>
            </div>

            <div className="scroll-section flex-grow-1 d-flex flex-column" style={{gap: '0.5rem'}}>
              {matches.length === 0 && !loadingMatches && (
                <div className="empty-state">
                  <p className="mb-1">No open matches found</p>
                  <p className="small mb-0">Create one or use Auto Match!</p>
                </div>
              )}

              {loadingMatches && matches.length === 0 && (
                <div className="empty-state">
                  <div className="spinner mx-auto mb-2" style={{width: 24, height: 24, borderWidth: 2}}></div>
                  <p className="small mb-0">Loading matches...</p>
                </div>
              )}

              {matches.map((m: any) => {
                const label = m.label ? JSON.parse(m.label) : {};
                const matchMode = label.mode || "classic";
                const shortId = m.matchId ? m.matchId.substring(0, 12) + "..." : "???";

                return (
                  <div className="match-card" key={m.matchId}>
                    <div className="match-info">
                      <span className="match-label">Match</span>
                      <span className="match-id-short">{shortId}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge-mode ${matchMode === 'timed' ? 'badge-timed' : 'badge-classic'}`}>
                        {matchMode}
                      </span>
                      <button
                        className="btn-primary px-3 py-1"
                        style={{fontSize: '12px'}}
                        onClick={() => handleJoinMatch(m.matchId)}
                        disabled={joiningId === m.matchId}
                      >
                        {joiningId === m.matchId ? "..." : "Join"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- Create Tab --- */}
        {activeTab === "create" && (
          <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center animate-fade-in">
            <p className="text-muted small mb-2">
              Create a <strong>{mode}</strong> match and share the Match ID with a friend
            </p>
            <button className="btn-primary w-100 py-3" style={{fontSize: '15px', maxWidth: '300px'}} onClick={handleCreateMatch}>
              Create Private Match
            </button>
            <p className="text-muted small mt-3" style={{fontSize: '0.75rem'}}>
              Once created, your match ID will be visible in the game screen.<br/>
              Share it with your opponent so they can join via "Browse → Join by ID".
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
