import { Routes, Route } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import ScholarshipsPage from "./pages/ScholarshipsPage.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import DemoPortalPage from "./pages/DemoPortalPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* The demo portal is the standalone "external" scholarship website that
          Playwright automates - it intentionally lives outside the dashboard Shell. */}
      <Route path="/demo-portal" element={<DemoPortalPage />} />

      <Route
        path="/*"
        element={
          <Shell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
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
