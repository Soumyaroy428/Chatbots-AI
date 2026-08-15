import { Route, Routes } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { ChatAppPage } from "./pages/ChatAppPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<ChatAppPage />} />
        <Route path="/app/c/:conversationId" element={<ChatAppPage />} />
      </Route>
    </Routes>
  );
}
