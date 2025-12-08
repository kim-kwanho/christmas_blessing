import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StartScreen from './views/StartScreen'
import MainApp from './views/MainApp'
import AdminPage from './pages/admin/AdminPage'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/advent" replace />} />
        <Route path="/advent" element={<StartScreen />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/advent" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

