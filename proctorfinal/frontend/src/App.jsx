import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import useAuthStore from "./store/authStore"
import LoginPage        from "./pages/LoginPage"
import RegisterPage     from "./pages/RegisterPage"
import StudentDashboard from "./pages/StudentDashboard"
import ExamPage         from "./pages/ExamPage"
import MyResult         from "./pages/MyResult"
import AdminDashboard   from "./pages/AdminDashboard"
import QuestionManager  from "./pages/QuestionManager"
import ExamResults      from "./pages/ExamResults"

function Guard({ children, role }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

function Root() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right"
        toastOptions={{ style:{ background:"#0c1525", color:"#e2e8f0",
          border:"1px solid #1e3a5f", fontSize:13 } }} />
      <Routes>
        <Route path="/"         element={<Root />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Student */}
        <Route path="/dashboard"             element={<Guard role="student"><StudentDashboard /></Guard>} />
        <Route path="/exam/:id"              element={<Guard role="student"><ExamPage /></Guard>} />
        <Route path="/my-result/:attemptId"  element={<Guard role="student"><MyResult /></Guard>} />

        {/* Admin */}
        <Route path="/admin"                         element={<Guard role="admin"><AdminDashboard /></Guard>} />
        <Route path="/admin/questions/:examId"       element={<Guard role="admin"><QuestionManager /></Guard>} />
        <Route path="/results/:examId"               element={<Guard role="admin"><ExamResults /></Guard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
