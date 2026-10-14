import { useState, useCallback } from 'react';

export interface Coordinates {
  x: number;
  y: number;
  pctX: number;
  pctY: number;
}

/**
 * 🛠️ Reusable Coordinate Tracker Hook
 * Calculates exact px and percentage (%) coordinates of mouse cursor over a container element.
 */
export function useCoordinateTracker() {
  const [coords, setCoords] = useState<Coordinates>({ x: 0, y: 0, pctX: 0, pctY: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const pctX = +((x / rect.width) * 100).toFixed(1);
    const pctY = +((y / rect.height) * 100).toFixed(1);
    setCoords({ x, y, pctX, pctY });
  }, []);

  return {
    coords,
    handleMouseMove,
  };
}

export default useCoordinateTracker;
