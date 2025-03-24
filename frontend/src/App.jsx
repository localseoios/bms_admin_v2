import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Notifications from "./pages/Notifications/Notifications";
import Layout from "./components/Layout";
import UserManagement from "./pages/UserManagement/UserManagement";
import Login from "./pages/Auth/Login";
import ComplianceManagement from "./pages/Job/ComplianceManagement/ComplianceManagement";
import CreateJob from "./pages/Job/Admin/CreateJob";
import AdminJobs from "./pages/Job/Admin/AdminJobs";
import ClientProfile from "./pages/ClientProfile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes Wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          <Route path="user-management" element={<UserManagement />} />
          <Route path="create-job" element={<CreateJob />} />
          <Route path="admin/jobs" element={<AdminJobs />} />
          <Route path="compliance" element={<ComplianceManagement />} />
          <Route path="notifications" element={<Notifications />} />
          <Route
            path="dashboard"
            element={<div>Dashboard (Coming Soon)</div>}
          />
          <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
          <Route
            path="documents"
            element={<div>Documents (Coming Soon)</div>}
          />
          <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
          <Route path="/clients/:gmail" element={<ClientProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;