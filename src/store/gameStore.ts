import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import initialDrivers from '../db/drivers.json';
import initialTeams from '../db/teams.json';
import type {Driver} from '@/src/types/driver';
import type { Team } from '../types/teams';
import { UpdateDriverRatings } from '../hooks/ratingUpdater';
import locations from '../db/locations.json'
import type { deltaStats } from '../types/deltaStats';

// -1 not selected , 0 normal , 1 game mode

type GameStore = {
  mode:-1|0|1
  season: number
  round: number
  drivers: Driver[]
  teams: Team[]
  deltaNumber:deltaStats[]
  addRaceResult: (results: string[]) => void
  nextSeason: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      mode:-1,
      season: 2026,
      round: 1,
      drivers: initialDrivers,
      teams: initialTeams,
      deltaNumber:[],
      resetGame: () => {
        localStorage.removeItem('f1-story-storage');
        set({
          season: 2026,
          round: 1,
          drivers: initialDrivers.map(d => ({ ...d, points: 0, standings: [] })),
          teams: initialTeams.map(t => ({ ...t, points: 0 })),
          deltaNumber:[]
        });
      },

      nextSeason: () => set((state) => {
        const sortedDrivers = [...state.drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
        const newDrivers = sortedDrivers.map((d, index) => {
          const newStanding = { season: state.season, position: index + 1 };
          return {
            ...d,
            points: 0,
            standings: d.standings ? [...d.standings, newStanding] : [newStanding]
          };
        });
        const newTeams = state.teams.map((t) => ({ ...t, points: 0 }));

        return {
          season: state.season + 1,
          round: 1,
          drivers: newDrivers,
          teams: newTeams,
          deltaNumber:[]
        };
      }),

      addRaceResult: (results: string[]) => {
        set((state) => {
          const updatedDrivers = state.drivers.map(d => ({
            ...d,
            points: Number.isNaN(d.points) || d.points == null ? 0 : d.points,
            standings: [...(d.standings || [])]
          }));
          const updatedTeams = state.teams.map(t => ({
            ...t,
            points: Number.isNaN(t.points) || t.points == null ? 0 : t.points
          }));
          const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
          
          results.forEach((driverName, index) => {
            const driver = updatedDrivers.find((d) => d.name === driverName);
            if (driver) {
              const pts = index < points.length ? points[index] : 0;
              driver.points += pts;

              driver.standings.push({
                season: state.season,
                position: index + 1,
                round: state.round
              });

              if (pts > 0 && driver.team) {
                const team = updatedTeams.find((t) => t.name === driver.team);
                if (team) {
                  team.points += pts;
                }
              }
            }
          });
          
          updatedDrivers.sort((a, b) => (b.points || 0) - (a.points || 0));
          updatedTeams.sort((a, b) => (b.points || 0) - (a.points || 0));

          const checkPointRounds=[6,12,18,24]

          if(checkPointRounds.includes(state.round)){
            const finalUpdatedDrivers=UpdateDriverRatings(updatedDrivers,updatedTeams,state.round,locations)
            const newDrivers=finalUpdatedDrivers.newDrivers
            const deltaNumber=finalUpdatedDrivers.deltaNumber
            return { 
            round: state.round + 1, 
            drivers: newDrivers,
            teams: updatedTeams,
            deltaNumber:deltaNumber
          };
            
          }

          

          
          return { 
            round: state.round + 1, 
            drivers: updatedDrivers,
            teams: updatedTeams,
            deltaNumber:state.deltaNumber

          };
        });
      },

      setMode: (mode: -1 | 0 | 1) => set({ mode }),
    }),
    {
      name: 'f1-story-storage', 
    }
  )
);
