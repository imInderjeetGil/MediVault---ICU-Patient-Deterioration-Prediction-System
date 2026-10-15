import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patient from "./pages/Patient";
import Simulation from "./pages/Simulation";
import LaboratoryResults from "./pages/LaboratoryResults";
import Medications from "./pages/Medications";
import Observations from "./pages/Observations";
function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/patients/:id" element={<ProtectedRoute><Patient /></ProtectedRoute>} />
        <Route path="/simulation" element={<ProtectedRoute><Simulation /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/patients/:id/labs" element={<LaboratoryResults />}/>
        <Route path="/patients/:id/medications" element={<Medications />} />
        <Route
  path="/patients/:id/observations"
  element={<Observations />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
