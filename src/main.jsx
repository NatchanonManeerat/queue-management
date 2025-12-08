import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </HashRouter>
  </StrictMode>,
)
