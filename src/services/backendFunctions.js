/**
 * Firebase Cloud Functions / Backend Logic
 * Deploy these to Firebase Cloud Functions for production use
 * These are example implementations for reference
 */

// To use Cloud Functions:
// 1. Install Firebase CLI: npm install -g firebase-tools
// 2. Create functions folder: firebase init functions
// 3. Deploy: firebase deploy --only functions

// ==================== VALIDATION UTILITIES ====================

/**
 * Validate customer name
 * @param {string} name - Customer name
 * @returns {object} Validation result {valid: boolean, message: string}
 */
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, message: "Please enter your name" };
  }
  if (name.trim().length > 30) {
    return { valid: false, message: "Name must not exceed 50 characters" };
  }
  return { valid: true, message: "Name is valid" };
};

/**
 * Validate phone number (exactly 10 digits)
 * @param {string} phone - Phone number
 * @returns {object} Validation result {valid: boolean, message: string}
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { valid: false, message: "Please enter your phone number" };
  }
  if (phone.length !== 10) {
    return { valid: false, message: "Phone number must be exactly 10 digits" };
  }
  if (!/^\d{10}$/.test(phone)) {
    return { valid: false, message: "Phone number must contain only digits" };
  }
  return { valid: true, message: "Phone number is valid" };
};

/**
 * Validate party size
 * @param {number} partySize - Number of people
 * @returns {object} Validation result {valid: boolean, message: string}
 */
export const validatePartySize = (partySize) => {
  const size = parseInt(partySize);
  if (isNaN(size) || size < 1) {
    return { valid: false, message: "Party size must be at least 1" };
  }
  if (size > 20) {
    return { valid: false, message: "Party size cannot exceed 20" };
  }
  return { valid: true, message: "Party size is valid" };
};

/**
 * Validate all join queue fields together
 * @param {string} name - Customer name
 * @param {string} phone - Phone number
 * @param {number} partySize - Party size
 * @returns {object} Validation result {valid: boolean, message: string}
 */
export const validateJoinQueueForm = (name, phone, partySize) => {
  // Validate name
  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    return nameValidation;
  }

  // Validate phone
  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.valid) {
    return phoneValidation;
  }

  // Validate party size
  const partySizeValidation = validatePartySize(partySize);
  if (!partySizeValidation.valid) {
    return partySizeValidation;
  }

  return { valid: true, message: "All fields are valid" };
};

// Example Cloud Function for validating queue entries
/*
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Create queue entry with validation
exports.createQueueEntry = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.name || !data.phone || !data.partySize) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    if (data.partySize < 1 || data.partySize > 20) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Party size must be between 1 and 20'
      );
    }

    // Phone validation (basic)
    const phoneRegex = /^[0-9\-\+\s\(\)]+$/;
    if (!phoneRegex.test(data.phone)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid phone number format'
      );
    }

    // Get next position
    const snapshot = await db.collection('queues').orderBy('position', 'desc').limit(1).get();
    const nextPosition = snapshot.empty ? 1 : snapshot.docs[0].data().position + 1;

    // Create queue entry
    const docRef = await db.collection('queues').add({
      name: data.name.trim(),
      phone: data.phone.trim(),
      partySize: parseInt(data.partySize),
      status: 'waiting',
      position: nextPosition,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { id: docRef.id, position: nextPosition };
  } catch (error) {
    console.error('Error creating queue entry:', error);
    throw error;
  }
});

// Update queue status with automatic position management
exports.updateQueueStatus = functions.https.onCall(async (data, context) => {
  try {
    const { queueId, newStatus } = data;

    if (!queueId || !newStatus) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    const validStatuses = ['waiting', 'serving', 'completed', 'skipped'];
    if (!validStatuses.includes(newStatus)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid status: ${newStatus}`
      );
    }

    const updateData = {
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (newStatus === 'serving') {
      updateData.servedAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (newStatus === 'completed') {
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await db.collection('queues').doc(queueId).update(updateData);

    // If completed/skipped, reorganize positions
    if (newStatus === 'completed' || newStatus === 'skipped') {
      const snapshot = await db
        .collection('queues')
        .where('status', 'in', ['waiting', 'serving'])
        .orderBy('position', 'asc')
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc, index) => {
        batch.update(doc.ref, { position: index + 1 });
      });
      await batch.commit();
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating queue status:', error);
    throw error;
  }
});

// Get daily statistics
exports.getDailyStats = functions.https.onCall(async (data, context) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await db
      .collection('queues')
      .where('status', '==', 'completed')
      .where('completedAt', '>=', today)
      .get();

    let totalPeople = 0;
    let totalWaitTime = 0;

    snapshot.forEach((doc) => {
      const docData = doc.data();
      totalPeople += docData.partySize || 1;

      if (docData.servedAt && docData.createdAt) {
        const waitTime = (docData.servedAt - docData.createdAt) / 1000 / 60; // in minutes
        totalWaitTime += waitTime;
      }
    });

    return {
      totalServed: snapshot.size,
      totalPeople,
      avgWaitTime: snapshot.size > 0 ? Math.round(totalWaitTime / snapshot.size) : 0,
    };
  } catch (error) {
    console.error('Error getting daily stats:', error);
    throw error;
  }
});

// Cleanup old entries (run daily)
exports.cleanupOldQueues = functions.pubsub
  .schedule('every day 03:00')
  .timeZone('Asia/Manila')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const snapshot = await db
        .collection('queues')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`Deleted ${snapshot.size} old queue entries`);
      return null;
    } catch (error) {
      console.error('Error cleaning up old queues:', error);
      throw error;
    }
  });
*/

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format time to readable format
 * @param {Date} date - Date to format
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date to readable format
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Calculate wait time in minutes
 * @param {Date} createdAt - Queue entry creation time
 * @param {Date} servedAt - Queue service start time
 * @returns {number} Wait time in minutes
 */
export const calculateWaitTime = (createdAt, servedAt) => {
  if (!createdAt || !servedAt) return 0;
  const created = new Date(createdAt).getTime();
  const served = new Date(servedAt).getTime();
  return Math.round((served - created) / 1000 / 60);
};

/**
 * Generate unique queue ID (alternative to Firebase docId)
 * @returns {string} Unique ID
 */
export const generateQueueId = () => {
  return `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
