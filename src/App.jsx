import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patient from "./pages/Patient";
import Simulation from "./pages/Simulation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients/:id" element={<Patient />} />
        <Route path="/simulation" element={<Simulation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;