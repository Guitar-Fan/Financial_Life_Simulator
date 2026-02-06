/**
 * Time Manager Composable - Controls game time flow and scheduling
 */
import { computed } from 'vue';
import { useBakeryFinancialStore } from '../stores/bakery-financial-store';
import { useBakeryGameStore } from '../stores/bakery-game-store';

export function useBakeryTimeManager() {
  const financialStore = useBakeryFinancialStore();
  const gameStore = useBakeryGameStore();

  const currentTimeFormatted = computed(() => financialStore.currentTime);
  
  const currentDayOfWeek = computed(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[(financialStore.day - 1) % 7];
  });

  const isWeekend = computed(() => {
    const dayOfWeek = (financialStore.day - 1) % 7;
    return dayOfWeek === 5 || dayOfWeek === 6; // Saturday or Sunday
  });

  const isBusinessHours = computed(() => {
    return financialStore.hour >= 6 && financialStore.hour < 20;
  });

  const hoursUntilClose = computed(() => {
    if (!isBusinessHours.value) return 0;
    return 20 - financialStore.hour;
  });

  const minutesUntilClose = computed(() => {
    if (!isBusinessHours.value) return 0;
    return (hoursUntilClose.value - 1) * 60 + (60 - financialStore.minute);
  });

  function setSpeed(speed: number) {
    gameStore.setGameSpeed(speed);
  }

  function pause() {
    gameStore.pauseGame();
  }

  function resume() {
    gameStore.resumeGame();
  }

  function skipToTime(hour: number, minute: number = 0) {
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error('Invalid time');
      return;
    }
    financialStore.setTime(hour, minute);
  }

  function skipToNextDay() {
    financialStore.endDay();
  }

  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = financialStore.hour;
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
  }

  return {
    // Computed
    currentTimeFormatted,
    currentDayOfWeek,
    isWeekend,
    isBusinessHours,
    hoursUntilClose,
    minutesUntilClose,
    
    // Methods
    setSpeed,
    pause,
    resume,
    skipToTime,
    skipToNextDay,
    formatMinutes,
    getTimeOfDay,
  };
}
