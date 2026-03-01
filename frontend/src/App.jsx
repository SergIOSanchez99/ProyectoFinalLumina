import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import CourseView from './pages/CourseView'
import CollaborativeEditor from './pages/CollaborativeEditor'
import Profile from './pages/Profile'
import ImpactDashboard from './pages/ImpactDashboard'
import Friends from './pages/Friends'
import Messages from './pages/Messages'

// Components
import Navbar from './components/Navbar'
import Chatbot from './components/Chatbot'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading-spinner">Cargando...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function AppContent() {
  const { user } = useAuth()

  return (
    <Router>
      <div className="app">
        {user && <Navbar />}
        
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            } />
            
            <Route path="/courses/:courseId" element={
              <ProtectedRoute>
                <CourseView />
              </ProtectedRoute>
            } />
            
            <Route path="/editor/:noteId" element={
              <ProtectedRoute>
                <CollaborativeEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/profile/:userId?" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/impact" element={
              <ProtectedRoute>
                <ImpactDashboard />
              </ProtectedRoute>
            } />
            <Route path="/friends" element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            } />
            
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        {user && <Chatbot />}
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
