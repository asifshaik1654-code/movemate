import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { movesApi } from '../api/movesApi';
import { useAuth } from './AuthContext';

const MoveContext = createContext(null);

export const MoveProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [moves, setMoves] = useState([]);
  const [activeMoveId, setActiveMoveIdState] = useState(() => localStorage.getItem('movemate_active_move_id') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMoves = useCallback(async () => {
    if (!isAuthenticated) {
      setMoves([]);
      setActiveMoveIdState('');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await movesApi.getMoves({ limit: 50 });
      const moveList = res.data?.moves || [];
      setMoves(moveList);

      // Select active move
      const savedId = localStorage.getItem('movemate_active_move_id');
      const exists = moveList.find((m) => m._id === savedId);

      if (exists) {
        setActiveMoveIdState(savedId);
      } else if (moveList.length > 0) {
        setActiveMoveIdState(moveList[0]._id);
        localStorage.setItem('movemate_active_move_id', moveList[0]._id);
      } else {
        setActiveMoveIdState('');
        localStorage.removeItem('movemate_active_move_id');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  const setActiveMoveId = (id) => {
    setActiveMoveIdState(id);
    if (id) {
      localStorage.setItem('movemate_active_move_id', id);
    } else {
      localStorage.removeItem('movemate_active_move_id');
    }
  };

  const activeMove = moves.find((m) => m._id === activeMoveId) || null;
  const userRole = activeMove?.userRole || 'Viewer';
  const isOwner = userRole === 'Owner';
  const canEdit = userRole === 'Owner' || userRole === 'Editor';

  return (
    <MoveContext.Provider
      value={{
        moves,
        activeMove,
        activeMoveId,
        setActiveMoveId,
        userRole,
        isOwner,
        canEdit,
        isLoading,
        error,
        refreshMoves: fetchMoves
      }}
    >
      {children}
    </MoveContext.Provider>
  );
};

export const useMove = () => {
  const context = useContext(MoveContext);
  if (!context) {
    throw new Error('useMove must be used within a MoveProvider');
  }
  return context;
};

