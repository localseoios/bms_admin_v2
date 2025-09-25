import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Notifications from "./pages/Notifications/Notifications";
import Layout from "./components/Layout";
import UserManagement from "./pages/UserManagement/UserManagement";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import ComplianceSelection from "./pages/ComplianceSelection";
import ModeSelection from "./pages/ModeSelection";
import ComplianceManagement from "./pages/Job/ComplianceManagement/ComplianceManagement";
import ComplianceCulture from "./pages/Compliance/ComplianceCulture";
import ComplianceResource from "./pages/Compliance/ComplianceResource";
import ComplianceResourceCenter from "./pages/Compliance/ComplianceResourceCenter";
import ComplianceStaff from "./pages/Compliance/ComplianceStaff";
import ComplianceNotifications from "./pages/Compliance/ComplianceNotifications";
import ComplianceStaffManagement from "./pages/ComplianceStaff/ComplianceStaffManagement";
import ComplianceClients from "./pages/Compliance/ComplianceClients";
import TestComplianceClients from "./pages/Compliance/TestComplianceClients";
import ComplianceClientDetails from "./pages/Compliance/ComplianceClientDetails";
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
import Reports from "./pages/Reports/Reports";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Mode Selection Route (after login) */}
          <Route path="/mode-selection" element={<ModeSelection />} />
          
          {/* New Compliance System - Outside Layout (No Sidebar) */}
          <Route path="/compliance-selection" element={<ComplianceSelection />} />
          <Route path="/compliance-culture" element={<ComplianceCulture />} />
          <Route path="/compliance-staff" element={<ComplianceStaff />} />
          <Route path="/compliance-resources" element={<ComplianceResource />} />
          <Route path="/compliance/clients-test" element={<div style={{padding: '50px', backgroundColor: '#4ade80', color: 'white', fontSize: '30px', textAlign: 'center'}}><h1>✅ SUCCESS! NO SIDEBAR/HEADER!</h1><p>URL: /compliance/clients-test</p><p>Full screen without sidebar!</p></div>} />
          <Route path="/compliance/clients" element={<ComplianceClients />} />
          <Route path="/compliance/client/:id" element={<ComplianceClientDetails />} />
          <Route path="/compliance-notifications" element={<ComplianceNotifications />} />

          {/* Protected Routes Wrapped in Layout - SPECIFIC PATHS ONLY */}
          <Route path="/*" element={<Layout />}>
            <Route index element={<Navigate to="/mode-selection" replace />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="create-job" element={<CreateJob />} />
            <Route path="admin/jobs" element={<AdminJobs />} />
            {/* Original Compliance Management - Keep as is */}
            <Route path="compliance-management" element={<ComplianceManagement />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route
              path="documents"
              element={<div>Documents (Coming Soon)</div>}
            />
            <Route
              path="settings"
              element={<div>Settings (Coming Soon)</div>}
            />

            {/* Client Profiles */}
            <Route path="clients/:gmail" element={<ClientProfile />} />

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
            
            {/* Compliance Resource Center - Protected Route */}
            <Route path="compliance-resource-center" element={<ComplianceResourceCenter />} />
            
            {/* Compliance Staff Management - Protected Route */}
            <Route path="compliance-staff-management" element={<ComplianceStaffManagement />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
