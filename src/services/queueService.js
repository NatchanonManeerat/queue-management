import {
  getDatabase,
  ref,
  push,
  get,
  set,
  update,
  remove,
  onValue,
} from "firebase/database";
import app from "../firebaseConfig";

const db = getDatabase(app);

// Database structure:
// queues/
//   waiting/        (active customers waiting)
//   serving/        (currently being served)
//   archived/       (completed + skipped)
//   stats/
//     daily/        (cached daily statistics)
//     monthly/      (cached monthly statistics)

// ==================== CUSTOMER FUNCTIONS ====================

/**
 * Join a queue by submitting name, party size, and phone number
 * @param {string} name - Customer name
 * @param {number} partySize - Number of people in party
 * @param {string} phone - Phone number
 * @returns {Promise<string>} Queue ID
 */
export const joinQueue = async (name, partySize, phone) => {
  try {
    if (!name.trim() || !phone.trim() || partySize < 1) {
      throw new Error("Please fill in all fields correctly");
    }

    const position = await getNextPosition();

    const newQueueRef = push(ref(db, "queues/waiting"), {
      name: name.trim(),
      partySize: parseInt(partySize),
      phone: phone.trim(),
      position: position,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return newQueueRef.key;
  } catch (error) {
    console.error("Error joining queue:", error);
    throw error;
  }
};

/**
 * Get customer's queue position and details
 * @param {string} queueId - Queue document ID
 * @returns {Promise<object>} Queue data with position
 */
export const getQueueStatus = async (queueId) => {
  try {
    // Search in waiting first
    let docSnap = await get(ref(db, `queues/waiting/${queueId}`));

    if (!docSnap.exists()) {
      // Search in serving
      docSnap = await get(ref(db, `queues/serving/${queueId}`));
    }

    if (!docSnap.exists()) {
      throw new Error("Queue entry not found");
    }

    const queueData = docSnap.val();
    const position = await getQueuePosition(queueId);
    const estimatedWaitTime = await getEstimatedWaitTime();

    return {
      id: queueId,
      ...queueData,
      position,
      estimatedWaitTime,
    };
  } catch (error) {
    console.error("Error getting queue status:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time queue status updates
 * @param {string} queueId - Queue document ID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToQueueStatus = (queueId, callback) => {
  try {
    // Subscribe to waiting path
    const unsubscribeWaiting = onValue(
      ref(db, `queues/waiting/${queueId}`),
      (snapshot) => {
        if (snapshot.exists()) {
          callback({
            id: queueId,
            status: "waiting",
            ...snapshot.val(),
          });
        }
      }
    );

    // Subscribe to serving path
    const unsubscribeServing = onValue(
      ref(db, `queues/serving/${queueId}`),
      (snapshot) => {
        if (snapshot.exists()) {
          callback({
            id: queueId,
            status: "serving",
            ...snapshot.val(),
          });
        }
      }
    );

    // Return combined unsubscribe function
    return () => {
      unsubscribeWaiting();
      unsubscribeServing();
    };
  } catch (error) {
    console.error("Error setting up subscription:", error);
    throw error;
  }
};

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get real-time queue list ordered by position
 * @param {function} callback - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToQueueList = (callback) => {
  try {
    const unsubscribeWaiting = onValue(
      ref(db, "queues/waiting"),
      (snapshot) => {
        const waitingQueues = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.entries(data).forEach(([id, value]) => {
            waitingQueues.push({ id, status: "waiting", ...value });
          });
        }

        // Get serving queues too
        onValue(ref(db, "queues/serving"), (servingSnapshot) => {
          const servingQueues = [];
          if (servingSnapshot.exists()) {
            const data = servingSnapshot.val();
            Object.entries(data).forEach(([id, value]) => {
              servingQueues.push({ id, status: "serving", ...value });
            });
          }

          // Combine and sort
          const allQueues = [...waitingQueues, ...servingQueues].sort(
            (a, b) => a.position - b.position
          );

          callback(allQueues);
        });
      },
      (error) => {
        console.error("Error subscribing to queue list:", error);
        callback([]);
      }
    );

    return unsubscribeWaiting;
  } catch (error) {
    console.error("Error setting up queue list subscription:", error);
    throw error;
  }
};

/**
 * Update queue status (move between waiting, serving, archived)
 * @param {string} queueId - Queue document ID
 * @param {string} newStatus - New status (serving, completed, skipped)
 * @returns {Promise<void>}
 */
export const updateQueueStatus = async (queueId, newStatus) => {
  try {
    const validStatuses = ["serving", "completed", "skipped"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    // First, find where the queue currently is
    let queueData = null;
    let currentLocation = null; // 'waiting' or 'serving'

    // Check in waiting first
    const waitingSnap = await get(ref(db, `queues/waiting/${queueId}`));
    if (waitingSnap.exists()) {
      queueData = waitingSnap.val();
      currentLocation = "waiting";
    } else {
      // Check in serving
      const servingSnap = await get(ref(db, `queues/serving/${queueId}`));
      if (servingSnap.exists()) {
        queueData = servingSnap.val();
        currentLocation = "serving";
      }
    }

    if (!queueData) {
      throw new Error("Queue entry not found in waiting or serving");
    }

    // Handle transition to serving
    if (newStatus === "serving") {
      if (currentLocation === "waiting") {
        // Move from waiting to serving
        await remove(ref(db, `queues/waiting/${queueId}`));
        await set(ref(db, `queues/serving/${queueId}`), {
          ...queueData,
          servedAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    // Handle transition to completed or skipped
    else if (newStatus === "completed" || newStatus === "skipped") {
      // Calculate wait time
      let waitTime = 0;
      if (queueData.createdAt && queueData.servedAt) {
        waitTime = Math.round(
          (queueData.servedAt - queueData.createdAt) / 1000 / 60
        );
      }

      // Remove from current location (waiting or serving)
      if (currentLocation === "waiting") {
        await remove(ref(db, `queues/waiting/${queueId}`));
      } else if (currentLocation === "serving") {
        await remove(ref(db, `queues/serving/${queueId}`));
      }

      // Add to archived
      await set(ref(db, `queues/archived/${queueId}`), {
        ...queueData,
        status: newStatus,
        completedAt: Date.now(),
        waitTime: waitTime,
      });

      // Update daily stats
      await updateDailyStats(newStatus, queueData.partySize || 1, waitTime);
    }
  } catch (error) {
    console.error("Error updating queue status:", error);
    throw error;
  }
};

/**
 * Reorder queues (swap positions) - only for waiting queue
 * @param {string} queueId1 - First queue ID
 * @param {string} queueId2 - Second queue ID
 * @returns {Promise<void>}
 */
export const reorderQueues = async (queueId1, queueId2) => {
  try {
    const doc1 = await get(ref(db, `queues/waiting/${queueId1}`));
    const doc2 = await get(ref(db, `queues/waiting/${queueId2}`));

    if (!doc1.exists() || !doc2.exists()) {
      throw new Error("One or both queue entries not found in waiting queue");
    }

    const pos1 = doc1.val().position;
    const pos2 = doc2.val().position;

    await update(ref(db, `queues/waiting/${queueId1}`), { position: pos2 });
    await update(ref(db, `queues/waiting/${queueId2}`), { position: pos1 });
  } catch (error) {
    console.error("Error reordering queues:", error);
    throw error;
  }
};

/**
 * Get daily statistics from cached data
 * @returns {Promise<object>} Statistics
 */
export const getDailyStats = async () => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const statsSnap = await get(ref(db, `queues/stats/daily/${today}`));

    if (statsSnap.exists()) {
      return statsSnap.val();
    }

    // If no stats yet, return zeros
    return {
      totalServed: 0,
      totalPeople: 0,
      avgWaitTime: 0,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error("Error getting daily stats:", error);
    return {
      totalServed: 0,
      totalPeople: 0,
      avgWaitTime: 0,
    };
  }
};

/**
 * Update daily and monthly statistics
 * @private
 * @param {string} status - completed or skipped
 * @param {number} partySize - Number of people
 * @param {number} waitTime - Wait time in minutes
 */
const updateDailyStats = async (status, partySize, waitTime) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const month = today.substring(0, 7); // YYYY-MM

    const statsRef = ref(db, `queues/stats/daily/${today}`);
    const statsSnap = await get(statsRef);

    let currentStats = {
      totalServed: 0,
      totalPeople: 0,
      totalWaitTime: 0,
      lastUpdated: Date.now(),
    };

    if (statsSnap.exists()) {
      currentStats = statsSnap.val();
    }

    // Only count completed for stats
    if (status === "completed") {
      currentStats.totalServed = (currentStats.totalServed || 0) + 1;
      currentStats.totalPeople = (currentStats.totalPeople || 0) + partySize;
      currentStats.totalWaitTime = (currentStats.totalWaitTime || 0) + waitTime;
      currentStats.avgWaitTime = Math.round(
        currentStats.totalWaitTime / currentStats.totalServed
      );
    }

    currentStats.lastUpdated = Date.now();

    // Update daily stats
    await update(ref(db, `queues/stats/daily/${today}`), currentStats);

    // Update monthly stats (aggregate)
    if (status === "completed") {
      const monthlyRef = ref(db, `queues/stats/monthly/${month}`);
      const monthlySnap = await get(monthlyRef);

      let monthlyStats = {
        totalServed: 0,
        totalPeople: 0,
        totalWaitTime: 0,
      };

      if (monthlySnap.exists()) {
        monthlyStats = monthlySnap.val();
      }

      monthlyStats.totalServed = (monthlyStats.totalServed || 0) + 1;
      monthlyStats.totalPeople = (monthlyStats.totalPeople || 0) + partySize;
      monthlyStats.totalWaitTime = (monthlyStats.totalWaitTime || 0) + waitTime;
      monthlyStats.avgWaitTime = Math.round(
        monthlyStats.totalWaitTime / monthlyStats.totalServed
      );

      await update(ref(db, `queues/stats/monthly/${month}`), monthlyStats);
    }
  } catch (error) {
    console.error("Error updating stats:", error);
  }
};

/**
 * Get queue completion history from archived
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<array>} Completed queues
 */
export const getCompletionHistory = async (limit = 20) => {
  try {
    const snapshot = await get(ref(db, "queues/archived"));

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    const completed = Object.entries(data)
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, limit);

    return completed;
  } catch (error) {
    console.error("Error getting completion history:", error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get next available position (from waiting queue only)
 * @returns {Promise<number>} Next position number
 */
const getNextPosition = async () => {
  try {
    const snapshot = await get(ref(db, "queues/waiting"));

    if (!snapshot.exists()) {
      return 1;
    }

    const data = snapshot.val();
    const positions = Object.values(data).map((q) => q.position || 0);

    return positions.length > 0 ? Math.max(...positions) + 1 : 1;
  } catch (error) {
    console.error("Error getting next position:", error);
    return 1;
  }
};

/**
 * Get customer's position in queue
 * @param {string} queueId - Queue document ID
 * @returns {Promise<number>} Position number
 */
const getQueuePosition = async (queueId) => {
  try {
    const snapshot = await get(ref(db, "queues/waiting"));

    if (!snapshot.exists()) {
      return 0;
    }

    const data = snapshot.val();
    const waitingQueues = Object.entries(data)
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => a.position - b.position);

    const position = waitingQueues.findIndex((q) => q.id === queueId) + 1;
    return position > 0 ? position : 0;
  } catch (error) {
    console.error("Error getting queue position:", error);
    return 0;
  }
};

/**
 * Calculate estimated wait time based on waiting queue
 * @returns {Promise<number>} Estimated wait time in minutes
 */
const getEstimatedWaitTime = async () => {
  try {
    const settingsSnapshot = await get(ref(db, "settings/config"));
    const avgServingTime = settingsSnapshot.exists()
      ? settingsSnapshot.val().averageServingTime || 5
      : 5;

    const waitingSnapshot = await get(ref(db, "queues/waiting"));

    if (waitingSnapshot.exists()) {
      const data = waitingSnapshot.val();
      const peopleAhead = Object.values(data).length;

      return peopleAhead * avgServingTime;
    }

    return 0;
  } catch (error) {
    console.error("Error calculating estimated wait time:", error);
    return 0;
  }
};

/**
 * Delete a queue entry (from waiting or serving)
 * @param {string} queueId - Queue document ID
 * @returns {Promise<void>}
 */
export const deleteQueueEntry = async (queueId) => {
  try {
    // Try to remove from waiting first
    await remove(ref(db, `queues/waiting/${queueId}`));

    // Also try to remove from serving in case it was moved
    await remove(ref(db, `queues/serving/${queueId}`));
  } catch (error) {
    console.error("Error deleting queue entry:", error);
    throw error;
  }
};

/**
 * Search for queue by phone number (only in waiting/serving)
 * @param {string} phone - Phone number to search
 * @returns {Promise<object>} Queue data with ID or null if not found
 */
export const searchQueueByPhone = async (phone) => {
  try {
    if (!phone || !phone.trim()) {
      throw new Error("Please enter a phone number");
    }

    const cleanSearchPhone = phone.trim().toLowerCase();

    // Search in waiting queue
    const waitingSnapshot = await get(ref(db, "queues/waiting"));

    if (waitingSnapshot.exists()) {
      const data = waitingSnapshot.val();

      for (const [queueId, queueData] of Object.entries(data)) {
        if (
          !queueData ||
          !queueData.phone ||
          typeof queueData.phone !== "string"
        ) {
          continue;
        }

        const queuePhone = queueData.phone.trim().toLowerCase();

        if (
          queuePhone === cleanSearchPhone ||
          queuePhone.slice(-7) === cleanSearchPhone.slice(-7)
        ) {
          return {
            id: queueId,
            status: "waiting",
            ...queueData,
          };
        }
      }
    }

    // Search in serving queue
    const servingSnapshot = await get(ref(db, "queues/serving"));

    if (servingSnapshot.exists()) {
      const data = servingSnapshot.val();

      for (const [queueId, queueData] of Object.entries(data)) {
        if (
          !queueData ||
          !queueData.phone ||
          typeof queueData.phone !== "string"
        ) {
          continue;
        }

        const queuePhone = queueData.phone.trim().toLowerCase();

        if (
          queuePhone === cleanSearchPhone ||
          queuePhone.slice(-7) === cleanSearchPhone.slice(-7)
        ) {
          return {
            id: queueId,
            status: "serving",
            ...queueData,
          };
        }
      }
    }

    throw new Error("No queue found with this phone number");
  } catch (error) {
    console.error("Error searching queue by phone:", error);
    throw error;
  }
};
