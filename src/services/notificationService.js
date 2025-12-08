/**
 * Notification Service for Queue Management
 * Handles notifications when customer's turn is approaching
 */

const NOTIFICATION_THRESHOLD = 2; // Notify when 2 people ahead

/**
 * Check if customer should be notified
 * @param {number} currentPosition - Customer's current position
 * @param {number} previousPosition - Customer's previous position
 * @param {array} queueList - Current queue list
 * @returns {object|null} Notification data or null
 */
export const checkNotification = (currentPosition, previousPosition, queueList) => {
  if (!queueList || queueList.length === 0) return null;

  // Count people ahead (only "waiting" status)
  const peopleAhead = queueList.filter((q) => q.status === "waiting").length - 1;

  // Notify if customer is approaching their turn
  if (peopleAhead <= NOTIFICATION_THRESHOLD && peopleAhead >= 0) {
    return {
      type: "approaching",
      message: `You're up soon! ${peopleAhead} people ahead of you.`,
      peopleAhead,
    };
  }

  return null;
};

/**
 * Send browser notification
 * @param {string} title - Notification title
 * @param {object} options - Notification options
 */
export const sendBrowserNotification = (title, options = {}) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      ...options,
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          icon: "/favicon.ico",
          ...options,
        });
      }
    });
  }
};

/**
 * Request notification permission from user
 * @returns {Promise<boolean>} Permission granted or not
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

/**
 * Create sound notification
 */
export const playNotificationSound = () => {
  try {
    // Using Web Audio API to create a beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
};

/**
 * Show toast notification (in-app)
 * Used for visual feedback
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'info', 'warning'
 * @returns {object} Toast object with dismiss method
 */
export const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: ${getToastColor(type)};
    color: white;
    padding: 16px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-size: 14px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  const timer = setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 4000);

  return {
    dismiss: () => {
      clearTimeout(timer);
      toast.remove();
    },
  };
};

/**
 * Get toast color based on type
 * @param {string} type - Toast type
 * @returns {string} Color code
 */
const getToastColor = (type) => {
  const colors = {
    success: "#4caf50",
    error: "#f44336",
    info: "#2196f3",
    warning: "#ff9800",
  };
  return colors[type] || colors.info;
};
