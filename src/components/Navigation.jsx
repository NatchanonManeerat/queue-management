import { Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import "./Navigation.css";

export default function Navigation() {
  const location = useLocation();
  const { isAdminLoggedIn, logout } = useAdminAuth();

  const isCustomerRoute = location.pathname.includes("/customer");
  const isAdminRoute = location.pathname.includes("/admin");

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🍽️</span>
          Queue Manager
        </Link>

        <div className="nav-menu">
          {!isAdminRoute && (
            <>
              <Link
                to="/customer/join"
                className={`nav-link ${
                  location.pathname === "/customer/join" ? "active" : ""
                }`}
              >
                Join Queue
              </Link>
              <Link
                to="/customer/my-queue"
                className={`nav-link ${
                  location.pathname === "/customer/my-queue" ? "active" : ""
                }`}
              >
                📱 My Queue
              </Link>
            </>
          )}

          {isAdminLoggedIn ? (
            <>
              <Link
                to="/admin/dashboard"
                className={`nav-link admin ${
                  location.pathname === "/admin/dashboard" ? "active" : ""
                }`}
              >
                👨‍💼 Dashboard
              </Link>
              <button onClick={logout} className="nav-link logout-btn">
                🚪 Logout
              </button>
            </>
          ) : (
            !isCustomerRoute && (
              <Link
                to="/admin/login"
                className={`nav-link admin ${
                  location.pathname === "/admin/login" ? "active" : ""
                }`}
              >
                🔐 Admin
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
