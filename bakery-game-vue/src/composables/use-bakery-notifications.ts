/**
 * Notifications Composable - Toast notifications system
 */
import { ref } from 'vue';

export interface BakeryNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration: number;
  timestamp: number;
}

const notifications = ref<BakeryNotification[]>([]);

export function useBakeryNotifications() {
  function addNotification(
    type: BakeryNotification['type'],
    title: string,
    message: string,
    duration: number = 3000
  ): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: BakeryNotification = {
      id,
      type,
      title,
      message,
      duration,
      timestamp: Date.now(),
    };

    notifications.value.push(notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  function clearAll() {
    notifications.value = [];
  }

  // Convenience methods
  function success(title: string, message: string, duration?: number) {
    return addNotification('success', title, message, duration);
  }

  function error(title: string, message: string, duration?: number) {
    return addNotification('error', title, message, duration || 5000);
  }

  function warning(title: string, message: string, duration?: number) {
    return addNotification('warning', title, message, duration);
  }

  function info(title: string, message: string, duration?: number) {
    return addNotification('info', title, message, duration);
  }

  // Game-specific notifications
  function bakingComplete(recipeName: string, quantity: number) {
    success(
      'Baking Complete! 🥐',
      `${quantity}x ${recipeName} ready to sell`,
      4000
    );
  }

  function ingredientPurchased(ingredientName: string, quantity: number, cost: number) {
    info(
      'Purchase Complete',
      `${quantity}x ${ingredientName} - $${cost.toFixed(2)}`,
      3000
    );
  }

  function saleCompleted(total: number, items: number) {
    success(
      'Sale Complete! 💰',
      `Sold ${items} item(s) for $${total.toFixed(2)}`,
      3000
    );
  }

  function lowStock(ingredientName: string) {
    warning(
      'Low Stock Warning',
      `Running low on ${ingredientName}`,
      4000
    );
  }

  function spoilage(itemName: string, quantity: number) {
    error(
      'Spoilage Alert! 🗑️',
      `${quantity}x ${itemName} has spoiled and was discarded`,
      5000
    );
  }

  function staffHired(staffName: string, role: string) {
    success(
      'New Employee! 👨‍🍳',
      `${staffName} hired as ${role}`,
      4000
    );
  }

  function dayComplete(profit: number) {
    const isProfit = profit >= 0;
    if (isProfit) {
      success(
        'Day Complete! 📊',
        `Net profit: $${profit.toFixed(2)}`,
        5000
      );
    } else {
      warning(
        'Day Complete 📊',
        `Net loss: $${Math.abs(profit).toFixed(2)}`,
        5000
      );
    }
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
    // Game-specific
    bakingComplete,
    ingredientPurchased,
    saleCompleted,
    lowStock,
    spoilage,
    staffHired,
    dayComplete,
  };
}
