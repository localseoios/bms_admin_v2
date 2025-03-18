import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserManagement from "./pages/UserManagement";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Layout>
              <Routes>
                <Route index element={<UserManagement />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route
                  path="/dashboard"
                  element={<div>Dashboard (Coming Soon)</div>}
                />
                <Route
                  path="/reports"
                  element={<div>Reports (Coming Soon)</div>}
                />
                <Route
                  path="/documents"
                  element={<div>Documents (Coming Soon)</div>}
                />
                <Route
                  path="/settings"
                  element={<div>Settings (Coming Soon)</div>}
                />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
