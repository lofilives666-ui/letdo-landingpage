import { Navigate, Route, Routes } from "react-router-dom";
import { AdminHomePage } from "./pages/AdminHomePage";
import { AdminPage } from "./pages/AdminPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { MenuPage } from "./pages/MenuPage";
import { WelcomePage } from "./pages/WelcomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<MenuPage />} />
      <Route path="/admin/home" element={<AdminHomePage />} />
      <Route path="/admin/manage" element={<AdminPage />} />
      <Route path="/admin/profile" element={<AdminProfilePage />} />
      <Route path="/admin" element={<Navigate to="/admin/home" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
