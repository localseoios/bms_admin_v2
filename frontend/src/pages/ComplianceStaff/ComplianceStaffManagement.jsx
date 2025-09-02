import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaUserTie, FaArrowLeft, FaHome } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "../../utils/axios";
import { useNavigate } from "react-router-dom";
import ComplianceStaffForm from "./ComplianceStaffForm";
import ComplianceStaffDetails from "./ComplianceStaffDetails";

const ComplianceStaffManagement = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchComplianceStaff();
    fetchStatistics();
  }, []);

  const fetchComplianceStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (departmentFilter) params.append("department", departmentFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await axios.get(`/api/compliance-staff?${params}`);
      setStaffList(response.data.data);
    } catch (error) {
      console.error("Error fetching compliance staff:", error);
      toast.error("Failed to fetch compliance staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get("/api/compliance-staff/statistics");
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchComplianceStaff();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, departmentFilter, statusFilter]);

  const handleAddNew = () => {
    setSelectedStaff(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setEditMode(true);
    setShowForm(true);
  };

  const handleView = (staff) => {
    setSelectedStaff(staff);
    setShowDetails(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await axios.delete(`/api/compliance-staff/${id}`);
        toast.success("Staff member deleted successfully");
        fetchComplianceStaff();
        fetchStatistics();
      } catch (error) {
        console.error("Error deleting staff:", error);
        toast.error("Failed to delete staff member");
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedStaff(null);
    setEditMode(false);
    fetchComplianceStaff();
    fetchStatistics();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Active: "bg-green-100 text-green-800",
      "On Leave": "bg-yellow-100 text-yellow-800",
      Inactive: "bg-gray-100 text-gray-800",
      Terminated: "bg-red-100 text-red-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  const getDepartmentBadge = (department) => {
    const deptClasses = {
      KYC: "bg-blue-100 text-blue-800",
      BRA: "bg-purple-100 text-purple-800",
      Screening: "bg-indigo-100 text-indigo-800",
      "General Compliance": "bg-teal-100 text-teal-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${deptClasses[department] || "bg-gray-100 text-gray-800"}`}>
        {department}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/compliance-selection")}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Back</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <FaUserTie className="text-2xl text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-800">Compliance Staff Management</h1>
                <p className="text-xs text-gray-500">Manage registered staff members</p>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaHome className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Staff Directory</h2>
          <p className="text-gray-600">Manage your compliance team members and their information</p>
        </div>

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.total}</p>
              </div>
              <FaUserTie className="text-3xl text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.onLeave}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.inactive}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, staff ID, or designation..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="KYC">KYC</option>
              <option value="BRA">BRA</option>
              <option value="Screening">Screening</option>
              <option value="General Compliance">General Compliance</option>
            </select>
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
              <option value="Terminated">Terminated</option>
            </select>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaPlus /> Add Staff
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {staff.staffId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {staff.userId?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {staff.userId?.email || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getDepartmentBadge(staff.department)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {staff.designation}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(staff.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(staff)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleEdit(staff)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(staff._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ComplianceStaffForm
          staff={selectedStaff}
          editMode={editMode}
          onClose={handleFormClose}
        />
      )}

      {showDetails && (
        <ComplianceStaffDetails
          staff={selectedStaff}
          onClose={() => {
            setShowDetails(false);
            setSelectedStaff(null);
          }}
        />
      )}
      </div>
    </div>
  );
};

export default ComplianceStaffManagement;