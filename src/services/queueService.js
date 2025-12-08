import { 
  getDatabase, 
  ref, 
  push, 
  get, 
  update,
  remove,
  onValue
} from "firebase/database";
import app from "../firebaseConfig";

const db = getDatabase(app);

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

    const newQueueRef = push(ref(db, "queues"), {
      name: name.trim(),
      partySize: parseInt(partySize),
      phone: phone.trim(),
      status: "waiting",
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
    const docSnap = await get(ref(db, `queues/${queueId}`));
    
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
    const unsubscribe = onValue(
      ref(db, `queues/${queueId}`),
      (snapshot) => {
        if (snapshot.exists()) {
          callback({
            id: queueId,
            ...snapshot.val(),
          });
        }
      },
      (error) => {
        console.error("Error subscribing to queue status:", error);
      }
    );

    return unsubscribe;
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
    const unsubscribe = onValue(
      ref(db, "queues"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const queueList = Object.entries(data)
            .map(([id, value]) => ({
              id,
              ...value,
            }))
            .filter(q => q.status === "waiting" || q.status === "serving")
            .sort((a, b) => a.position - b.position);
          
          callback(queueList);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.error("Error subscribing to queue list:", error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up queue list subscription:", error);
    throw error;
  }
};

/**
 * Update queue status (waiting, serving, completed, skipped)
 * @param {string} queueId - Queue document ID
 * @param {string} newStatus - New status
 * @returns {Promise<void>}
 */
export const updateQueueStatus = async (queueId, newStatus) => {
  try {
    const validStatuses = ["waiting", "serving", "completed", "skipped"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const updateData = {
      status: newStatus,
      updatedAt: Date.now(),
    };

    if (newStatus === "serving") {
      updateData.servedAt = Date.now();
    } else if (newStatus === "completed" || newStatus === "skipped") {
      updateData.completedAt = Date.now();
    }

    await update(ref(db, `queues/${queueId}`), updateData);
  } catch (error) {
    console.error("Error updating queue status:", error);
    throw error;
  }
};

/**
 * Reorder queues (swap positions)
 * @param {string} queueId1 - First queue ID
 * @param {string} queueId2 - Second queue ID
 * @returns {Promise<void>}
 */
export const reorderQueues = async (queueId1, queueId2) => {
  try {
    const doc1 = await get(ref(db, `queues/${queueId1}`));
    const doc2 = await get(ref(db, `queues/${queueId2}`));

    if (!doc1.exists() || !doc2.exists()) {
      throw new Error("One or both queue entries not found");
    }

    const pos1 = doc1.val().position;
    const pos2 = doc2.val().position;

    await update(ref(db, `queues/${queueId1}`), { position: pos2 });
    await update(ref(db, `queues/${queueId2}`), { position: pos1 });
  } catch (error) {
    console.error("Error reordering queues:", error);
    throw error;
  }
};

/**
 * Get daily statistics
 * @returns {Promise<object>} Statistics
 */
export const getDailyStats = async () => {
  try {
    const snapshot = await get(ref(db, "queues"));
    
    if (!snapshot.exists()) {
      return { totalServed: 0, totalPeople: 0, avgWaitTime: 0 };
    }

    const data = snapshot.val();
    const completed = Object.values(data).filter(q => q.status === "completed");

    let totalPeople = 0;
    let totalWaitTime = 0;

    completed.forEach(q => {
      totalPeople += q.partySize || 1;
      if (q.servedAt && q.createdAt) {
        const waitTime = (q.servedAt - q.createdAt) / 1000 / 60; // in minutes
        totalWaitTime += waitTime;
      }
    });

    const avgWaitTime = completed.length > 0
      ? Math.round(totalWaitTime / completed.length)
      : 0;

    return {
      totalServed: completed.length,
      totalPeople,
      avgWaitTime,
      peakHour: "N/A",
    };
  } catch (error) {
    console.error("Error getting daily stats:", error);
    throw error;
  }
};

/**
 * Get queue completion history
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<array>} Completed queues
 */
export const getCompletionHistory = async (limit = 20) => {
  try {
    const snapshot = await get(ref(db, "queues"));
    
    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    const completed = Object.entries(data)
      .map(([id, value]) => ({ id, ...value }))
      .filter(q => q.status === "completed" || q.status === "skipped")
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
 * Get next available position
 * @returns {Promise<number>} Next position number
 */
const getNextPosition = async () => {
  try {
    const snapshot = await get(ref(db, "queues"));
    
    if (!snapshot.exists()) {
      return 1;
    }

    const data = snapshot.val();
    const positions = Object.values(data)
      .filter(q => q.status === "waiting")
      .map(q => q.position || 0);

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
    const snapshot = await get(ref(db, "queues"));
    
    if (!snapshot.exists()) {
      return 0;
    }

    const data = snapshot.val();
    const waitingQueues = Object.entries(data)
      .map(([id, value]) => ({ id, ...value }))
      .filter(q => q.status === "waiting")
      .sort((a, b) => a.position - b.position);

    const position = waitingQueues.findIndex(q => q.id === queueId) + 1;
    return position > 0 ? position : 0;
  } catch (error) {
    console.error("Error getting queue position:", error);
    return 0;
  }
};

/**
 * Calculate estimated wait time based on average serving time
 * @returns {Promise<number>} Estimated wait time in minutes
 */
const getEstimatedWaitTime = async () => {
  try {
    const settingsSnapshot = await get(ref(db, "settings/config"));
    const avgServingTime = settingsSnapshot.exists()
      ? settingsSnapshot.val().averageServingTime || 5
      : 5;

    const queuesSnapshot = await get(ref(db, "queues"));
    
    if (queuesSnapshot.exists()) {
      const data = queuesSnapshot.val();
      const peopleAhead = Object.values(data)
        .filter(q => q.status === "waiting").length;
      
      return peopleAhead * avgServingTime;
    }

    return 0;
  } catch (error) {
    console.error("Error calculating estimated wait time:", error);
    return 0;
  }
};

/**
 * Delete a queue entry
 * @param {string} queueId - Queue document ID
 * @returns {Promise<void>}
 */
export const deleteQueueEntry = async (queueId) => {
  try {
    await remove(ref(db, `queues/${queueId}`));
  } catch (error) {
    console.error("Error deleting queue entry:", error);
    throw error;
  }
};

/**
 * Search for queue by phone number
 * @param {string} phone - Phone number to search
 * @returns {Promise<object>} Queue data with ID or null if not found
 */
export const searchQueueByPhone = async (phone) => {
  try {
    if (!phone || !phone.trim()) {
      throw new Error("Please enter a phone number");
    }

    const queuesSnapshot = await get(ref(db, "queues"));
    
    if (!queuesSnapshot.exists()) {
      throw new Error("No queues found");
    }

    const data = queuesSnapshot.val();
    
    // Search for matching phone number (case insensitive, trim whitespace)
    const cleanSearchPhone = phone.trim().toLowerCase();
    
    for (const [queueId, queueData] of Object.entries(data)) {
      // Check if phone exists and is a string before processing
      if (!queueData || !queueData.phone || typeof queueData.phone !== 'string') {
        continue; // Skip this entry if phone is invalid
      }

      const queuePhone = queueData.phone.trim().toLowerCase();
      
      // Exact match or partial match (last 7 digits)
      if (
        queuePhone === cleanSearchPhone ||
        queuePhone.slice(-7) === cleanSearchPhone.slice(-7)
      ) {
        return {
          id: queueId,
          ...queueData,
        };
      }
    }

    throw new Error("No queue found with this phone number");
  } catch (error) {
    console.error("Error searching queue by phone:", error);
    throw error;
  }
};
