import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinQueue } from "../../services/queueService";
import { validateJoinQueueForm } from "../../services/backendFunctions";
import { showToast } from "../../services/notificationService";
import "../pages.css";

export default function CustomerJoin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    partySize: "1",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Handle phone input - only allow numbers and max 10 digits
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Remove any non-digit characters
    const numbersOnly = value.replace(/\D/g, "");
    // Limit to 10 digits
    const limitedPhone = numbersOnly.slice(0, 10);

    setFormData((prev) => ({
      ...prev,
      phone: limitedPhone,
    }));

    // Validation message
    if (limitedPhone.length < 10) {
      setPhoneError(`${limitedPhone.length}/10 digits`);
    } else if (limitedPhone.length === 10) {
      setPhoneError("✅");
    } else {
      setPhoneError("Maximum 10 digits allowed");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use centralized validation function
      const validation = validateJoinQueueForm(
        formData.name,
        formData.phone,
        formData.partySize
      );

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Join queue
      const queueId = await joinQueue(
        formData.name,
        formData.partySize,
        formData.phone
      );

      // Save to localStorage
      try {
        const saved = JSON.parse(localStorage.getItem("savedQueues") || "[]");
        saved.push({
          id: queueId,
          name: formData.name,
          phone: formData.phone,
          joinedAt: new Date().toLocaleString(),
        });
        localStorage.setItem("savedQueues", JSON.stringify(saved));
      } catch (err) {
        console.error("Error saving to localStorage:", err);
      }

      showToast("Successfully joined queue!", "success");
      showToast(`Your Queue ID: ${queueId}`, "info");

      // Redirect to status page
      setTimeout(() => {
        navigate(`/customer/status/${queueId}`);
      }, 1000);
    } catch (error) {
      console.error("Error joining queue:", error);
      showToast(error.message || "Failed to join queue", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-join-container">
      <div className="join-card">
        <h1>Join Queue</h1>
        <p className="subtitle">Enter your details to join the queue</p>

        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="name">Your Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
            <p className="hint">must not exceed 30 characters</p>
          </div>

          <div className="form-group">
            <label htmlFor="partySize">Party Size *</label>
            <input
              type="number"
              id="partySize"
              name="partySize"
              value={formData.partySize}
              onChange={handleChange}
              min="1"
              max="20"
              required
              disabled={loading}
            />
            <p className="hint">1-20 people</p>
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number * 
              <span className={`phone-validation ${phoneError.includes("✅") ? "valid" : phoneError.includes("/") ? "pending" : "error"}`}>
                {phoneError}
              </span>
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="Enter 10-digit phone number"
              maxLength="10"
              inputMode="numeric"
              required
              disabled={loading}
            />
            <p className="hint">Enter exactly 10 digits (numbers only)</p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || formData.phone.length !== 10}
          >
            {loading ? "Joining..." : "Join Queue"}
          </button>
        </form>

        <div className="info-section">
          <h3>How it works:</h3>
          <ol>
            <li>Enter your details above</li>
            <li>You'll receive a queue ID</li>
            <li>Track your position in real-time</li>
            <li>Get notified when it's your turn</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
