import { useState, useEffect } from "react";
import {
  subscribeToQueueList,
  updateQueueStatus,
  getDailyStats,
  getCompletionHistory,
} from "../../services/queueService";
import { showToast } from "../../services/notificationService";
import "../pages.css";

export default function AdminDashboard() {
  const [queues, setQueues] = useState([]);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedTab, setSelectedTab] = useState("queue");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Load initial stats
        const statsData = await getDailyStats();
        setStats(statsData);

        // Load history
        const historyData = await getCompletionHistory();
        setHistory(historyData);

        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setLoading(false);
      }
    };

    loadDashboard();

    // Subscribe to queue updates
    const unsubscribe = subscribeToQueueList((queueList) => {
      setQueues(queueList || []);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (queueId, newStatus) => {
    setActionLoading(queueId);
    try {
      await updateQueueStatus(queueId, newStatus);
      showToast(
        `Queue status updated to ${newStatus}`,
        "success"
      );

      // Refresh stats if completed
      if (newStatus === "completed") {
        const statsData = await getDailyStats();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Served Today</div>
          <div className="stat-value">{stats?.totalServed || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total People Served</div>
          <div className="stat-value">{stats?.totalPeople || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Wait Time</div>
          <div className="stat-value">{stats?.avgWaitTime || 0} mins</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Currently in Queue</div>
          <div className="stat-value">{queues.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${selectedTab === "queue" ? "active" : ""}`}
          onClick={() => setSelectedTab("queue")}
        >
          Queue Management
        </button>
        <button
          className={`tab ${selectedTab === "history" ? "active" : ""}`}
          onClick={() => setSelectedTab("history")}
        >
          Completion History
        </button>
      </div>

      {/* Queue Management Tab */}
      {selectedTab === "queue" && (
        <div className="queue-management">
          <h2>Current Queue</h2>
          {queues.length === 0 ? (
            <div className="empty-state">
              <p>No customers in queue</p>
            </div>
          ) : (
            <div className="queue-table">
              <div className="table-header">
                <div className="col col-pos">Pos</div>
                <div className="col col-name">Name</div>
                <div className="col col-party">Party</div>
                <div className="col col-phone">Phone</div>
                <div className="col col-status">Status</div>
                <div className="col col-actions">Actions</div>
              </div>

              {queues.map((queue) => (
                <div key={queue.id} className="table-row">
                  <div className="col col-pos">
                    <span className="position-badge">{queue.position}</span>
                  </div>
                  <div className="col col-name">{queue.name}</div>
                  <div className="col col-party">{queue.partySize}</div>
                  <div className="col col-phone">{queue.phone}</div>
                  <div className="col col-status">
                    <span
                      className={`status-badge status-${queue.status}`}
                    >
                      {queue.status}
                    </span>
                  </div>
                  <div className="col col-actions">
                    <div className="action-buttons">
                      {queue.status === "waiting" && (
                        <button
                          onClick={() => handleStatusChange(queue.id, "serving")}
                          className="btn btn-sm btn-primary"
                          disabled={actionLoading === queue.id}
                        >
                          Serve
                        </button>
                      )}
                      {queue.status === "serving" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(queue.id, "completed")
                            }
                            className="btn btn-sm btn-success"
                            disabled={actionLoading === queue.id}
                          >
                            Done
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(queue.id, "skipped")
                            }
                            className="btn btn-sm btn-danger"
                            disabled={actionLoading === queue.id}
                          >
                            Skip
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {selectedTab === "history" && (
        <div className="completion-history">
          <h2>Completion History</h2>
          {history.length === 0 ? (
            <div className="empty-state">
              <p>No completed queues yet</p>
            </div>
          ) : (
            <div className="history-table">
              <div className="table-header">
                <div className="col col-name">Name</div>
                <div className="col col-party">Party</div>
                <div className="col col-phone">Phone</div>
                <div className="col col-time">Completed At</div>
              </div>

              {history.map((item) => (
                <div key={item.id} className="table-row">
                  <div className="col col-name">{item.name}</div>
                  <div className="col col-party">{item.partySize}</div>
                  <div className="col col-phone">{item.phone}</div>
                  <div className="col col-time">
                    {item.completedAt
                      ? new Date(item.completedAt).toLocaleTimeString()
                      : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
