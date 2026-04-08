import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { sendMove, leaveMatch } from '../services/nakama';

export default function Game() {
  const { gameState, matchId, userId } = useGameStore();
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!gameState || !matchId) return null;

  const isMyTurn = gameState.currentTurn === userId;
  const me = gameState.players.find(p => p.userId === userId);
  const opponent = gameState.players.find(p => p.userId !== userId);

  const handleCellClick = (index: number) => {
    if (gameState.status !== 'PLAYING' || !isMyTurn || gameState.board[index] !== "") return;
    sendMove(matchId, index);
  };

  const handleLeave = async () => {
    if (window.confirm("Are you sure you want to leave?")) {
      await leaveMatch(matchId);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(matchId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getTimeRemaining = () => {
    if (gameState.mode !== 'timed' || !gameState.moveDeadline) return null;
    const timeLeft = gameState.moveDeadline - now;
    return Math.max(0, timeLeft);
  };

  const timeRemaining = getTimeRemaining();

  // --- WAITING STATE ---
  if (gameState.status === 'WAITING') {
    return (
      <div className="d-flex flex-column h-100 p-4 align-items-center justify-content-center text-center animate-fade-in" style={{color: '#fff'}}>
        <div className="spinner mb-4" style={{borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.2)'}}></div>
        
        <h5 className="fw-semibold mb-2">Waiting for opponent
          <span className="waiting-dots ms-1">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </h5>
        
        <p className="small mb-4" style={{color: 'rgba(255,255,255,0.6)'}}>
          {gameState.mode === 'timed' ? 'Timed Mode (30s/turn)' : 'Classic Mode'}
        </p>

        {/* Match ID share section */}
        <div className="w-100 mb-4" style={{maxWidth: '300px'}}>
          <label className="small d-block mb-1" style={{color: 'rgba(255,255,255,0.5)'}}>Share this Match ID</label>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="input-dark flex-grow-1"
              value={matchId}
              readOnly
              style={{fontSize: '0.72rem', fontFamily: 'monospace'}}
            />
            <button
              className="btn-outline px-3"
              style={{borderColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '12px', whiteSpace: 'nowrap'}}
              onClick={handleCopyId}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {me && (
          <div className="mb-4">
            <span className="small" style={{color: 'rgba(255,255,255,0.5)'}}>You are </span>
            <span className={`symbol-badge ms-1 ${me.symbol === 'X' ? 'x-badge' : 'o-badge'}`}>
              {me.symbol}
            </span>
          </div>
        )}

        <button 
          className="btn-outline px-4 py-2" 
          style={{borderRadius: '24px', fontSize: '13px', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)'}}
          onClick={handleLeave}
        >
          Leave room
        </button>
      </div>
    );
  }

  // --- PLAYING STATE ---
  return (
    <div className="d-flex flex-column h-100 p-4 align-items-center animate-fade-in" style={{color: '#fff'}}>
      
      {/* Top Players Header */}
      <div className="w-100 d-flex justify-content-center gap-4 mt-3 mb-3 text-center">
        <div style={{opacity: isMyTurn ? 1 : 0.5, transition: 'opacity 0.3s', flex: 1, maxWidth: '140px'}}>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <span className={`symbol-badge ${me?.symbol === 'X' ? 'x-badge' : 'o-badge'}`}>
              {me?.symbol || '?'}
            </span>
          </div>
          <div className="fw-bold" style={{fontSize: '15px', letterSpacing: '0.5px'}}>
            {me?.username?.toUpperCase() || 'YOU'}
          </div>
          <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)'}}>you</div>
        </div>

        <div style={{alignSelf: 'center', color: 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: '18px'}}>VS</div>

        <div style={{opacity: !isMyTurn ? 1 : 0.5, transition: 'opacity 0.3s', flex: 1, maxWidth: '140px'}}>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <span className={`symbol-badge ${opponent?.symbol === 'X' ? 'x-badge' : 'o-badge'}`}>
              {opponent?.symbol || '?'}
            </span>
          </div>
          <div className="fw-bold" style={{fontSize: '15px', letterSpacing: '0.5px'}}>
            {opponent?.username?.toUpperCase() || 'OPPONENT'}
          </div>
          <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)'}}>opponent</div>
        </div>
      </div>

      {/* Turn Indicator + Timer */}
      <div className="mb-4 d-flex align-items-center justify-content-center gap-2">
        <span className="fw-semibold" style={{color: 'rgba(255,255,255,0.8)', fontSize: '14px'}}>
          {isMyTurn ? "Your turn" : "Opponent's turn"}
        </span>

        {timeRemaining !== null && (
          <span className={`timer-badge ${timeRemaining <= 10 ? 'urgent' : ''}`}>
            ⏱ 0:{timeRemaining.toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Board */}
      <div className="w-100 mb-auto px-2">
        <div className="board">
          {gameState.board.map((cell, idx) => (
            <div
              key={idx}
              className={`cell ${cell.toLowerCase()} ${cell !== '' ? 'taken' : ''}`}
              onClick={() => handleCellClick(idx)}
              style={(!isMyTurn || cell !== "" || gameState.status !== 'PLAYING') ? { cursor: 'default' } : {}}
            >
              {cell}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Button */}
      <div className="mt-3 mb-2 w-100 text-center">
        <button 
          className="btn-outline px-4 py-2" 
          style={{borderRadius: '24px', fontSize: '13px', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)'}}
          onClick={handleLeave}
        >
          Leave room
        </button>
      </div>
    </div>
  );
}
