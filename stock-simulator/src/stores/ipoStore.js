/**
 * IPO Store - Primary Market State Management
 * 
 * Manages: IPO calendar, player IOIs, allocations, lock-up tracking
 * 
 * Educational Purpose: Teaches how IPOs actually work - the allocation
 * process, oversubscription, and why retail investors rarely get shares
 * at the offering price.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useIPOStore = create(
  persist(
    (set, get) => ({
      // IPO Calendar - available offerings
      ipoCalendar: [],
      
      // Currently selected IPO for viewing
      selectedIPO: null,
      
      // Player's Indications of Interest
      // { [ipoId]: { shares, maxPrice, submittedAt, status } }
      playerIOIs: {},
      
      // Allocation results
      // { [ipoId]: { sharesAllocated, allocationPrice, allocatedAt, filled } }
      allocations: {},
      
      // IPO positions (shares received from IPOs, with lock-up info)
      ipoPositions: {},
      
      // S-1 Analysis scores (for mini-game)
      // { [ipoId]: { score, correctAnswers, totalQuestions, completedAt } }
      analysisScores: {},
      
      // Actions
      setIPOCalendar: (calendar) => set({ ipoCalendar: calendar }),
      
      selectIPO: (ipoId) => set({ selectedIPO: ipoId }),
      
      /**
       * Submit an Indication of Interest
       */
      submitIOI: (ipoId, shares, maxPrice) => {
        const ipo = get().ipoCalendar.find(i => i.id === ipoId);
        if (!ipo) return { success: false, error: 'IPO not found' };
        
        // Validate IOI
        if (shares <= 0) return { success: false, error: 'Invalid share quantity' };
        if (maxPrice < ipo.priceRange.low) {
          return { success: false, error: `Price must be at least $${ipo.priceRange.low}` };
        }
        
        set((state) => ({
          playerIOIs: {
            ...state.playerIOIs,
            [ipoId]: {
              shares,
              maxPrice,
              submittedAt: new Date().toISOString(),
              status: 'PENDING'
            }
          }
        }));
        
        return { success: true };
      },
      
      /**
       * Cancel an IOI
       */
      cancelIOI: (ipoId) => {
        set((state) => {
          const newIOIs = { ...state.playerIOIs };
          if (newIOIs[ipoId]) {
            newIOIs[ipoId] = { ...newIOIs[ipoId], status: 'CANCELLED' };
          }
          return { playerIOIs: newIOIs };
        });
      },
      
      /**
       * Process IPO allocation (called when IPO prices/completes)
       */
      processAllocation: (ipoId, allocationResult) => {
        set((state) => ({
          allocations: {
            ...state.allocations,
            [ipoId]: {
              ...allocationResult,
              allocatedAt: new Date().toISOString()
            }
          },
          playerIOIs: {
            ...state.playerIOIs,
            [ipoId]: {
              ...state.playerIOIs[ipoId],
              status: allocationResult.sharesAllocated > 0 ? 'ALLOCATED' : 'NOT_ALLOCATED'
            }
          }
        }));
        
        // If allocated shares, add to IPO positions
        if (allocationResult.sharesAllocated > 0) {
          const ipo = get().ipoCalendar.find(i => i.id === ipoId);
          set((state) => ({
            ipoPositions: {
              ...state.ipoPositions,
              [ipo.ticker]: {
                shares: allocationResult.sharesAllocated,
                costBasis: allocationResult.allocationPrice,
                ipoId,
                acquiredAt: new Date().toISOString(),
                lockUpExpiry: calculateLockUpExpiry(ipo),
                isLocked: true
              }
            }
          }));
        }
        
        return allocationResult;
      },
      
      /**
       * Record S-1 analysis score
       */
      recordAnalysisScore: (ipoId, score, correctAnswers, totalQuestions) => {
        set((state) => ({
          analysisScores: {
            ...state.analysisScores,
            [ipoId]: {
              score,
              correctAnswers,
              totalQuestions,
              completedAt: new Date().toISOString()
            }
          }
        }));
      },
      
      /**
       * Update lock-up status (called on market date changes)
       */
      updateLockUpStatus: (currentDate) => {
        const current = new Date(currentDate);
        
        set((state) => {
          const updatedPositions = { ...state.ipoPositions };
          
          for (const [ticker, position] of Object.entries(updatedPositions)) {
            if (position.lockUpExpiry && new Date(position.lockUpExpiry) <= current) {
              updatedPositions[ticker] = { ...position, isLocked: false };
            }
          }
          
          return { ipoPositions: updatedPositions };
        });
      },
      
      /**
       * Get IPO by ID
       */
      getIPO: (ipoId) => {
        return get().ipoCalendar.find(i => i.id === ipoId);
      },
      
      /**
       * Get player's IOI for an IPO
       */
      getPlayerIOI: (ipoId) => {
        return get().playerIOIs[ipoId];
      },
      
      /**
       * Get allocation for an IPO
       */
      getAllocation: (ipoId) => {
        return get().allocations[ipoId];
      },
      
      /**
       * Get upcoming IPOs (not yet priced)
       */
      getUpcomingIPOs: () => {
        return get().ipoCalendar.filter(ipo => ipo.status === 'UPCOMING');
      },
      
      /**
       * Get IPOs pending allocation
       */
      getPendingIPOs: () => {
        return get().ipoCalendar.filter(ipo => ipo.status === 'PRICING');
      },
      
      /**
       * Get completed IPOs
       */
      getCompletedIPOs: () => {
        return get().ipoCalendar.filter(ipo => ipo.status === 'COMPLETED');
      },
      
      /**
       * Reset IPO state
       */
      reset: () => set({
        playerIOIs: {},
        allocations: {},
        ipoPositions: {},
        analysisScores: {},
        selectedIPO: null
      })
    }),
    {
      name: 'market-terminal-ipo',
      partialize: (state) => ({
        playerIOIs: state.playerIOIs,
        allocations: state.allocations,
        ipoPositions: state.ipoPositions,
        analysisScores: state.analysisScores
      })
    }
  )
);

/**
 * Calculate lock-up expiry date (typically 180 days post-IPO)
 */
function calculateLockUpExpiry(ipo) {
  if (!ipo.expectedDate) return null;
  const ipoDate = new Date(ipo.expectedDate);
  ipoDate.setDate(ipoDate.getDate() + 180);
  return ipoDate.toISOString();
}

export default useIPOStore;
