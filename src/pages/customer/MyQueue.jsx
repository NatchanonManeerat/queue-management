import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQueueStatus, searchQueueByPhone } from "../../services/queueService";
import { showToast } from "../../services/notificationService";
import "../pages.css";

export default function MyQueue() {
  const navigate = useNavigate();
  const [searchMethod, setSearchMethod] = useState("queueId");
  const [queueId, setQueueId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedQueues, setSavedQueues] = useState([]);

  useEffect(() => {
    loadSavedQueues();
  }, []);

  const loadSavedQueues = () => {
    try {
      const saved = localStorage.getItem("savedQueues");
      setSavedQueues(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error("Error loading saved queues:", error);
      setSavedQueues([]);
    }
  };

  const handleRetrieveQueue = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (searchMethod === "queueId" && !queueId.trim()) {
        throw new Error("Please enter your Queue ID");
      }

      if (searchMethod === "phone" && !phone.trim()) {
        throw new Error("Please enter your phone number");
      }

      let foundQueue = null;

      // Search by Queue ID
      if (searchMethod === "queueId") {
        const status = await getQueueStatus(queueId.trim());
        if (!status) {
          throw new Error("Queue not found with this ID");
        }
        foundQueue = {
          id: queueId.trim(),
          ...status,
        };
      }

      // Search by Phone Number
      if (searchMethod === "phone") {
        foundQueue = await searchQueueByPhone(phone.trim());
      }

      if (!foundQueue) {
        throw new Error("Queue not found");
      }

      // Save to localStorage
      const queues = JSON.parse(localStorage.getItem("savedQueues") || "[]");
      const exists = queues.find((q) => q.id === foundQueue.id);
      
      if (!exists) {
        queues.push({
          id: foundQueue.id,
          name: foundQueue.name,
          phone: foundQueue.phone,
          joinedAt: new Date().toLocaleString(),
        });
        localStorage.setItem("savedQueues", JSON.stringify(queues));
        loadSavedQueues();
      }

      showToast("Queue found! Redirecting...", "success");
      setTimeout(() => {
        navigate(`/customer/status/${foundQueue.id}`);
      }, 800);
    } catch (error) {
      console.error("Error retrieving queue:", error);
      showToast(error.message || "Failed to find queue", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClickSavedQueue = (id) => {
    navigate(`/customer/status/${id}`);
  };

  const handleDeleteSavedQueue = (id) => {
    const queues = JSON.parse(localStorage.getItem("savedQueues") || "[]");
    const filtered = queues.filter(q => q.id !== id);
    localStorage.setItem("savedQueues", JSON.stringify(filtered));
    loadSavedQueues();
    showToast("Queue removed from saved", "info");
  };

  return (
    <div className="my-queue-container">
      <div className="my-queue-card">
        <h1>📱 Retrieve Your Queue</h1>
        <p className="subtitle">Find your queue status using Queue ID or phone</p>

        {/* Saved Queues Section */}
        {savedQueues.length > 0 && (
          <div className="saved-queues-section">
            <h2>Your Saved Queues ({savedQueues.length})</h2>
            <div className="saved-queues-list">
              {savedQueues.map((queue) => (
                <div key={queue.id} className="saved-queue-item">
                  <div className="queue-info">
                    <p className="queue-name">👤 {queue.name}</p>
                    <p className="queue-id">ID: <code>{queue.id.substring(0, 12)}...</code></p>
                    <p className="queue-phone">📞 {queue.phone}</p>
                    <p className="queue-date">📅 {queue.joinedAt}</p>
                  </div>
                  <div className="queue-actions">
                    <button
                      onClick={() => handleClickSavedQueue(queue.id)}
                      className="btn btn-sm btn-primary"
                    >
                      ▶️ View Status
                    </button>
                    <button
                      onClick={() => handleDeleteSavedQueue(queue.id)}
                      className="btn btn-sm btn-danger"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="search-section">
          <h2>{savedQueues.length > 0 ? "Or Search for Queue" : "Search Your Queue"}</h2>

          <div className="search-method-tabs">
            <button
              className={`tab ${searchMethod === "queueId" ? "active" : ""}`}
              onClick={() => {
                setSearchMethod("queueId");
                setPhone("");
                setQueueId("");
              }}
            >
              🔑 Queue ID
            </button>
            <button
              className={`tab ${searchMethod === "phone" ? "active" : ""}`}
              onClick={() => {
                setSearchMethod("phone");
                setQueueId("");
                setPhone("");
              }}
            >
              📞 Phone Number
            </button>
          </div>

          <form onSubmit={handleRetrieveQueue} className="search-form">
            {searchMethod === "queueId" ? (
              <div className="form-group">
                <label htmlFor="queueId">Queue ID *</label>
                <input
                  type="text"
                  id="queueId"
                  value={queueId}
                  onChange={(e) => setQueueId(e.target.value)}
                  placeholder="Enter your Queue ID (e.g., -NxyZ1234...)"
                  disabled={loading}
                  autoFocus
                />
                <p className="hint">
                  💡 You received this ID when you joined the queue
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number (e.g., +1234567890)"
                  disabled={loading}
                  autoFocus
                />
                <p className="hint">
                  💡 Enter the phone number you used when joining the queue
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Searching..." : "Find My Queue"}
            </button>
          </form>
        </div>

        <div className="info-box">
          <h3>💡 How It Works</h3>
          <ul>
            <li>Your queues are saved automatically</li>
            <li>Come back anytime to check your status</li>
            <li>Your Queue ID never expires</li>
            <li>Close this browser and come back later</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
