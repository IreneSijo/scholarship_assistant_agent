import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import ScholarshipsPage from "./pages/ScholarshipsPage.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import DemoPortalPage from "./pages/DemoPortalPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public landing page - doubles as the login screen */}
      <Route path="/" element={<HomePage />} />

      {/* Old /login links still work, just bounce to the combined home/login page */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route path="/signup" element={<SignupPage />} />

      {/* The demo portal is the standalone "external" scholarship website that
          Playwright automates - it intentionally lives outside the dashboard Shell. */}
      <Route path="/demo-portal" element={<DemoPortalPage />} />

      {/* Authenticated app - wrapped in the Shell (sidebar + nav) */}
      <Route
        path="/*"
        element={
          <Shell>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/scholarships" element={<ScholarshipsPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </Shell>
        }
      />
    </Routes>
  );
}
