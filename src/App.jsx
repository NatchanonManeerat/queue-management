import { Route, Routes, Navigate } from "react-router-dom";
import './App.css'

// Customer Pages
import CustomerJoin from './pages/customer/Join'
import CustomerStatus from './pages/customer/Status'
import MyQueue from './pages/customer/MyQueue'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminLogin from './pages/admin/AdminLogin'

// Navigation & Protected Routes
import Navigation from './components/Navigation'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

export default function App() {
  return (
    <div className="app-container">
      <Navigation />
      <main className="main-content">
        <Routes>
          {/* Customer Routes */}
          <Route path="/customer/join" element={<CustomerJoin />} />
          <Route path="/customer/status/:queueId" element={<CustomerStatus />} />
          <Route path="/customer/my-queue" element={<MyQueue />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/customer/join" replace />} />
        </Routes>
      </main>
    </div>
  )
}

