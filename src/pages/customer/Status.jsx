import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getQueueStatus,
  subscribeToQueueStatus,
  deleteQueueEntry,
} from "../../services/queueService";
import {
  sendBrowserNotification,
  requestNotificationPermission,
  playNotificationSound,
} from "../../services/notificationService";
import "../pages.css";

export default function CustomerStatus() {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [previousPosition, setPreviousPosition] = useState(null);

  useEffect(() => {
    if (!queueId) {
      setError("Queue ID not found");
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        const data = await getQueueStatus(queueId);
        setQueueData(data);
        setPreviousPosition(data.position);
        setLoading(false);

        // Auto-save to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem("savedQueues") || "[]");
          const exists = saved.find((q) => q.id === queueId);
          if (!exists) {
            saved.push({
              id: queueId,
              name: data.name,
              phone: data.phone,
              joinedAt: new Date().toLocaleString(),
            });
            localStorage.setItem("savedQueues", JSON.stringify(saved));
          }
        } catch (err) {
          console.error("Error auto-saving to localStorage:", err);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadInitialData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToQueueStatus(queueId, (data) => {
      if (data) {
        setQueueData(data);

        // Check if position changed and notify
        if (previousPosition !== null && data.position < previousPosition) {
          playNotificationSound();
          if (notificationEnabled) {
            sendBrowserNotification("Queue Update", {
              body: `You've moved up! You're now position ${data.position}`,
            });
          }
        }

        setPreviousPosition(data.position);
      }
    });

    return () => unsubscribe();
  }, [queueId, previousPosition, notificationEnabled]);

  const handleEnableNotifications = async () => {
    try {
      const granted = await requestNotificationPermission();
      setNotificationEnabled(granted);
      if (granted) {
        sendBrowserNotification("Notifications Enabled", {
          body: "You'll be notified when it's your turn!",
        });
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  const handleLeaveQueue = async () => {
    if (window.confirm("Are you sure you want to leave the queue?")) {
      try {
        await deleteQueueEntry(queueId);
        navigate("/customer/join");
      } catch (error) {
        setError("Failed to leave queue: " + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="loading">Loading your queue status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/customer/join")} className="btn btn-primary">
            Back to Join Queue
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      waiting: "#ff9800",
      serving: "#2196f3",
      completed: "#4caf50",
      skipped: "#f44336",
    };
    return colors[status] || "#999";
  };

  const getStatusMessage = (status) => {
    const messages = {
      waiting: "Waiting in queue",
      serving: "You're being served!",
      completed: "Service completed",
      skipped: "You were skipped",
    };
    return messages[status] || status;
  };

  return (
    <div className="status-container">
      <div className="status-card">
        <h1>Your Queue Status</h1>

        <div className="queue-id-section">
          <p className="label">Queue ID:</p>
          <p className="queue-id">{queueId}</p>
          <small>Save this ID to check your status later</small>
        </div>

        <div className="status-info">
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{queueData?.name}</span>
          </div>

          <div className="info-row">
            <span className="label">Party Size:</span>
            <span className="value">{queueData?.partySize} people</span>
          </div>

          <div className="info-row">
            <span className="label">Phone:</span>
            <span className="value">{queueData?.phone}</span>
          </div>
        </div>

        <div
          className="position-card"
          style={{ borderColor: getStatusColor(queueData?.status) }}
        >
          <div className="position-number">
            Position <span className="big">{queueData?.position}</span>
          </div>
          <div
            className="status-badge"
            style={{ backgroundColor: getStatusColor(queueData?.status) }}
          >
            {getStatusMessage(queueData?.status)}
          </div>
          <div className="wait-time">
            Estimated wait: <strong>{queueData?.estimatedWaitTime} mins</strong>
          </div>
        </div>

        <div className="notification-section">
          <button
            onClick={handleEnableNotifications}
            className={`btn ${notificationEnabled ? "btn-success" : "btn-secondary"}`}
          >
            {notificationEnabled ? "✓ Notifications Enabled" : "Enable Notifications"}
          </button>
          <small>
            {notificationEnabled
              ? "You'll receive alerts when you're up soon"
              : "Get notified when it's your turn"}
          </small>
        </div>

        <button
          onClick={handleLeaveQueue}
          className="btn btn-danger"
          style={{ marginTop: "20px" }}
        >
          Leave Queue
        </button>

        <div className="refresh-info">
          <small>This page updates automatically</small>
        </div>
      </div>
    </div>
  );
}
