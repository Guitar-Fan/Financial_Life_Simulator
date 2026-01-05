/**
 * NotificationSystem.js - Subtle notification system
 * Replaces disruptive popups with smooth, non-intrusive notifications
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.nextId = 1;
        this.maxNotifications = 5;
        this.defaultDuration = 5000; // 5 seconds

        this.init();
        console.log('🔔 NotificationSystem initialized');
    }

    /**
     * Initialize the notification container
     */
    init() {
        // Create notification area
        this.container = document.createElement('div');
        this.container.id = 'notification-area';
        this.container.className = 'notification-area';

        // Add to body
        document.body.appendChild(this.container);
    }

    /**
     * Show a notification
     */
    notify(message, options = {}) {
        const notification = {
            id: this.nextId++,
            type: options.type || 'info', // 'success', 'info', 'warning', 'error'
            message: message,
            title: options.title || this.getDefaultTitle(options.type),
            icon: options.icon || this.getDefaultIcon(options.type),
            duration: options.duration !== undefined ? options.duration : this.defaultDuration,
            onClick: options.onClick || null,
            persistent: options.persistent || false
        };

        this.notifications.push(notification);
        this.showNotification(notification);

        // Auto-dismiss if not persistent
        if (!notification.persistent && notification.duration > 0) {
            setTimeout(() => {
                this.dismissNotification(notification.id);
            }, notification.duration);
        }

        // Limit notifications
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications[0];
            if (!oldest.persistent) {
                this.dismissNotification(oldest.id);
            }
        }

        return notification.id;
    }

    /**
     * Show notification element
     */
    showNotification(notification) {
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = `notification notification-${notification.type}`;
        element.setAttribute('data-id', notification.id);

        element.innerHTML = `
            <div class="notification-icon">${notification.icon}</div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
            </div>
            <button class="notification-close" aria-label="Close">×</button>
        `;

        // Click handler
        if (notification.onClick) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-close')) {
                    notification.onClick(notification);
                    this.dismissNotification(notification.id);
                }
            });
        }

        // Close button handler
        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismissNotification(notification.id);
        });

        // Add to container (prepend for newest on top)
        this.container.prepend(element);

        // Animate in
        requestAnimationFrame(() => {
            element.classList.add('notification-show');
        });
    }

    /**
     * Dismiss a notification
     */
    dismissNotification(notificationId) {
        const element = document.getElementById(`notification-${notificationId}`);
        if (!element) return;

        // Animate out
        element.classList.remove('notification-show');
        element.classList.add('notification-hide');

        // Remove after animation
        setTimeout(() => {
            element.remove();

            // Remove from array
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Dismiss all notifications
     */
    dismissAll() {
        const notificationsCopy = [...this.notifications];
        notificationsCopy.forEach(n => {
            if (!n.persistent) {
                this.dismissNotification(n.id);
            }
        });
    }

    /**
     * Get default title for notification type
     */
    getDefaultTitle(type) {
        const titles = {
            success: 'Success',
            info: 'Info',
            warning: 'Warning',
            error: 'Error'
        };
        return titles[type] || 'Notification';
    }

    /**
     * Get default icon for notification type
     */
    getDefaultIcon(type) {
        const icons = {
            success: '✅',
            info: '📢',
            warning: '⚠️',
            error: '❌',
            baking: '🥐',
            money: '💰',
            customer: '👤',
            staff: '👔'
        };
        return icons[type] || '📢';
    }

    // ==================== CONVENIENCE METHODS ====================

    /**
     * Show success notification
     */
    success(message, options = {}) {
        return this.notify(message, { ...options, type: 'success' });
    }

    /**
     * Show info notification
     */
    info(message, options = {}) {
        return this.notify(message, { ...options, type: 'info' });
    }

    /**
     * Show warning notification
     */
    warning(message, options = {}) {
        return this.notify(message, { ...options, type: 'warning' });
    }

    /**
     * Show error notification
     */
    error(message, options = {}) {
        return this.notify(message, { ...options, type: 'error' });
    }

    /**
     * Show baking notification
     */
    bakingComplete(itemName, quantity = 1) {
        return this.notify(
            `${quantity}x ${itemName} ready!`,
            {
                type: 'success',
                icon: '🥐',
                title: 'Baking Complete',
                duration: 3000
            }
        );
    }

    /**
     * Show money notification
     */
    moneyEarned(amount) {
        return this.notify(
            `Earned $${amount.toFixed(2)}`,
            {
                type: 'success',
                icon: '💰',
                title: 'Sale Complete',
                duration: 2000
            }
        );
    }

    /**
     * Show customer notification
     */
    customerArrived(customerName) {
        return this.notify(
            `${customerName} wants service`,
            {
                type: 'info',
                icon: '👤',
                title: 'Customer Arrived',
                duration: 4000
            }
        );
    }

    /**
     * Show staff notification
     */
    staffEvent(message, options = {}) {
        return this.notify(message, {
            ...options,
            type: 'info',
            icon: '👔',
            title: options.title || 'Staff Update'
        });
    }

    /**
     * Show task complete notification
     */
    taskComplete(taskType, staffName, success = true) {
        return this.notify(
            `${staffName} ${success ? 'completed' : 'failed'} ${taskType}`,
            {
                type: success ? 'success' : 'warning',
                icon: success ? '✅' : '⚠️',
                title: 'Task Update',
                duration: 3000
            }
        );
    }

    /**
     * Show progress notification (persistent until updated)
     */
    showProgress(message, options = {}) {
        const id = this.notify(message, {
            ...options,
            type: 'info',
            persistent: true,
            icon: options.icon || '⏳'
        });

        return {
            update: (newMessage) => {
                const element = document.getElementById(`notification-${id}`);
                if (element) {
                    const messageEl = element.querySelector('.notification-message');
                    if (messageEl) {
                        messageEl.textContent = newMessage;
                    }
                }
            },
            complete: () => {
                this.dismissNotification(id);
            }
        };
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.NotificationSystem = NotificationSystem;
}

// Add CSS styles dynamically if not already present
if (typeof document !== 'undefined') {
    const styleId = 'notification-system-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .notification-area {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                width: 350px;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
                pointer-events: none;
            }
            
            .notification {
                display: flex;
                gap: 12px;
                align-items: flex-start;
                padding: 16px;
                margin-bottom: 12px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                border-left: 4px solid #3498db;
                pointer-events: all;
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            
            .notification-show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification-hide {
                transform: translateX(400px);
                opacity: 0;
            }
            
            .notification-success {
                border-left-color: #2ecc71;
                background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(255, 255, 255, 0.95));
            }
            
            .notification-info {
                border-left-color: #3498db;
                background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(255, 255, 255, 0.95));
            }
            
            .notification-warning {
                border-left-color: #f39c12;
                background: linear-gradient(135deg, rgba(243, 156, 18, 0.1), rgba(255, 255, 255, 0.95));
            }
            
            .notification-error {
                border-left-color: #e74c3c;
                background: linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(255, 255, 255, 0.95));
            }
            
            .notification-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            
            .notification-content {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 14px;
                color: #2c3e50;
                margin-bottom: 4px;
            }
            
            .notification-message {
                font-size: 13px;
                color: #34495e;
                line-height: 1.4;
                word-wrap: break-word;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                color: #95a5a6;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: rgba(0, 0, 0, 0.05);
                color: #2c3e50;
            }
            
            .notification:hover {
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
            }
            
            /* Scrollbar styling */
            .notification-area::-webkit-scrollbar {
                width: 6px;
            }
            
            .notification-area::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .notification-area::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }
            
            .notification-area::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.3);
            }
        `;
        document.head.appendChild(style);
    }
}
