import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { leaveMatch, getLeaderboard } from '../services/nakama';

interface LeaderboardRecord {
  owner_id: string;
  username: string;
  score: number;
  metadata?: {
    wins?: number;
    losses?: number;
    draws?: number;
    streak?: number;
  };
}

export default function Result() {
  const { gameState, matchId, userId } = useGameStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    setLoadingBoard(true);
    getLeaderboard()
      .then(res => {
        const records = res?.owner_records || res?.records || [];
        setLeaderboard(records);
      })
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingBoard(false));
  }, []);

  if (!gameState || !matchId) return null;

  const isDraw = gameState.winner === "DRAW";
  const isWinner = gameState.winner === userId;
  const me = gameState.players.find(p => p.userId === userId);

  let title = "";
  let subtitle = "";
  let titleColor = "text-white";
  
  if (isDraw) {
    title = "DRAW";
    subtitle = "No winner this time";
    titleColor = "text-muted";
  } else if (isWinner) {
    title = "WINNER!";
    subtitle = "Great game!";
    titleColor = "";
  } else {
    title = "DEFEAT";
    subtitle = "Better luck next time";
    titleColor = "text-danger";
  }

  const handlePlayAgain = async () => {
    await leaveMatch(matchId);
  };

  const renderLeaderboard = () => {
    if (loadingBoard) {
      return (
        <div className="text-center py-3">
          <div className="spinner mx-auto mb-2" style={{width: 20, height: 20, borderWidth: 2, borderTopColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)'}}></div>
          <p className="small mb-0" style={{color: 'rgba(255,255,255,0.4)'}}>Loading leaderboard...</p>
        </div>
      );
    }

    if (leaderboard.length === 0) {
      return (
        <div className="text-center py-3">
          <p className="small mb-0" style={{color: 'rgba(255,255,255,0.4)'}}>No leaderboard data yet. Play more games!</p>
        </div>
      );
    }

    return (
      <table className="leaderboard-table w-100">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>W/L/D</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((record: LeaderboardRecord, idx: number) => {
            const isMe = record.owner_id === userId;
            // Stats come from metadata (passed as 6th arg to leaderboardRecordWrite)
            const stats = record.metadata || {};
            const w = stats.wins || 0;
            const l = stats.losses || 0;
            const d = stats.draws || 0;

            return (
              <tr key={idx} style={isMe ? {background: 'rgba(6, 182, 212, 0.08)'} : {}}>
                <td style={{color: 'rgba(255,255,255,0.4)', width: '30px'}}>{idx + 1}</td>
                <td className="fw-semibold">
                  {record.username || 'Anonymous'} {isMe && <span style={{color: 'var(--accent-teal)', fontSize: '0.7rem'}}>(you)</span>}
                </td>
                <td>
                  <span className="win-color">{w}</span>
                  <span style={{color: 'rgba(255,255,255,0.3)'}}>/</span>
                  <span className="loss-color">{l}</span>
                  <span style={{color: 'rgba(255,255,255,0.3)'}}>/</span>
                  <span className="draw-color">{d}</span>
                </td>
                <td className="fw-semibold">{record.score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="d-flex flex-column h-100 p-4 align-items-center justify-content-center bg-dark-theme animate-fade-in">
      
      {/* Large symbol */}
      <div className="mb-3" style={{fontSize: '72px', lineHeight: 1, fontWeight: 800}}>
        {isDraw ? (
          <span className="text-muted">—</span>
        ) : isWinner ? (
          <span style={{color: 'var(--accent-teal)'}}>{me?.symbol || 'X'}</span>
        ) : (
          <span className="text-danger">{gameState.players.find(p => p.userId !== userId)?.symbol || 'O'}</span>
        )}
      </div>

      {/* Title */}
      <h2 className={`fw-bold m-0 mb-1 ${titleColor}`} style={{fontSize: '26px', letterSpacing: '2px',
        color: isWinner ? 'var(--accent-teal)' : undefined
      }}>
        {title}
      </h2>
      <p className="small mb-4" style={{color: 'rgba(255,255,255,0.45)'}}>{subtitle}</p>

      {/* Leaderboard */}
      <div className="w-100 px-1" style={{maxWidth: '360px'}}>
        <div className="d-flex align-items-center justify-content-center gap-2 mb-3" style={{color: 'var(--accent-teal)'}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 22a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z"></path>
            <path d="M19 6V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v4.56A4.96 4.96 0 0 0 10.86 17h2.28A4.96 4.96 0 0 0 15 12.56V8h2a2 2 0 0 0 2-2z"></path>
          </svg>
          <span className="fw-semibold" style={{fontSize: '0.85rem'}}>Global Leaderboard</span>
        </div>

        <div className="scroll-section">
          {renderLeaderboard()}
        </div>
      </div>

      {/* Play Again */}
      <div className="mt-4 w-100 text-center">
        <button 
          className="btn-primary px-5 py-2" 
          style={{borderRadius: '8px', fontSize: '15px'}}
          onClick={handlePlayAgain}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
