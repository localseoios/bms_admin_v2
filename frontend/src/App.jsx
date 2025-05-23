import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Notifications from "./pages/Notifications/Notifications";
import Layout from "./components/Layout";
import UserManagement from "./pages/UserManagement/UserManagement";
import Login from "./pages/Auth/Login";
import ComplianceManagement from "./pages/Job/ComplianceManagement/ComplianceManagement";
import CreateJob from "./pages/Job/Admin/CreateJob";
import AdminJobs from "./pages/Job/Admin/AdminJobs";
import OperationManagement from "./pages/Job/OperationManagement/OperationManagement";
import JobDetails from "./pages/Job/OperationManagement/JobDetails";
import KYCManagement from "./pages/Job/KYCManagement/KYCManagement";
import BRAManagement from "./pages/Job/BRAManagement/BRAManagement";
import { AuthProvider } from "./context/AuthContext";
import ClientProfile from "./pages/ClientProfile";
import AccountManagement from "./pages/AccountManagement/AccountManagement";
import ClientPaymentDetails from "./pages/AccountManagement/ClientPaymentDetails";
import AssignedClients from "./pages/Job/OperationManagement/AssignedClients";
import CreatePreApprovedJob from "./pages/Job/OperationManagement/CreatePreApprovedJob";
import AllServices from "./pages/AdminService/AllServices";
import AddService from "./pages/AdminService/AddService";
import Dashboard from "./pages/Dashboard";
import AllClients from "./pages/Job/OperationManagement/AllClients";

function App() {
  return (
    <AuthProvider>
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
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
            <Route
              path="documents"
              element={<div>Documents (Coming Soon)</div>}
            />
            <Route
              path="settings"
              element={<div>Settings (Coming Soon)</div>}
            />

            {/* Client Profiles */}
            <Route path="/clients/:gmail" element={<ClientProfile />} />

            {/* Operation Management */}
            <Route
              path="operation-management"
              element={<OperationManagement />}
            />
            <Route path="assigned-clients" element={<AssignedClients />} />
            <Route path="job/:jobId" element={<JobDetails />} />
            <Route path="all-clients" element={<AllClients />} />

            {/* New pre-approved job route */}
            <Route
              path="create-pre-approved-job"
              element={<CreatePreApprovedJob />}
            />

            {/* KYC Management route */}
            <Route path="kyc-management" element={<KYCManagement />} />

            {/* BRA Management route */}
            <Route path="bra-management" element={<BRAManagement />} />

            {/* Account Management routes */}
            <Route path="account-management" element={<AccountManagement />} />
            <Route
              path="account-management/client/:gmail"
              element={<ClientPaymentDetails />}
            />

            <Route path="admin/services" element={<AllServices />} />
            <Route path="admin/services/add" element={<AddService />} />
            <Route path="admin/services/edit/:id" element={<AddService />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
