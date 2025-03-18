import { useState, useEffect } from "react";
import {
  UserPlusIcon,
  UserGroupIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import axiosInstance from "../utils/axios"; // Adjust the import path as needed

function UserManagement() {
  // State management
  const [activeTab, setActiveTab] = useState("createRole");
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [newRole, setNewRole] = useState({
    name: "",
    permissions: {
      clientManagement: {
        companyDetails: { editor: false, viewer: false },
        directorDetails: { editor: false, viewer: false },
        secretaryDetails: { editor: false, viewer: false },
        shareholderDetails: { editor: false, viewer: false },
        sefDetails: { editor: false, viewer: false },
        signedKyc: { editor: false, viewer: false },
        paymentDetails: { editor: false, viewer: false },
        auditedFinancial: { editor: false, viewer: false },
      },
      documentManagement: false,
      renewalManagement: false,
      complianceManagement: false,
      requestService: false,
      userManagement: false,
    },
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });

  // Fetch roles and users from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rolesResponse = await axiosInstance.get("/roles");
        setRoles(rolesResponse.data);
        const usersResponse = await axiosInstance.get("/users");
        setUsers(usersResponse.data);
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch data from server"
        );
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle role creation
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/roles", newRole);
      setRoles([...roles, response.data]);
      setNewRole({
        name: "",
        permissions: {
          clientManagement: {
            companyDetails: { editor: false, viewer: false },
            directorDetails: { editor: false, viewer: false },
            secretaryDetails: { editor: false, viewer: false },
            shareholderDetails: { editor: false, viewer: false },
            sefDetails: { editor: false, viewer: false },
            signedKyc: { editor: false, viewer: false },
            paymentDetails: { editor: false, viewer: false },
            auditedFinancial: { editor: false, viewer: false },
          },
          documentManagement: false,
          renewalManagement: false,
          complianceManagement: false,
          requestService: false,
          userManagement: false,
        },
      });
      alert("Role created successfully!"); // Replace with a toast notification if preferred
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create role");
    }
  };

  // Handle user creation
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/users", newUser);
      setUsers([...users, response.data]);
      setNewUser({ name: "", email: "", password: "", roleId: "" });
      alert("User added successfully!"); // Replace with a toast notification if preferred
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add user");
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-12">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              User Management
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage user roles and permissions for your organization
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="sm:hidden">
            <select
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="createRole">Create Role</option>
              <option value="addUser">Add User</option>
            </select>
          </div>

          <div className="hidden sm:block">
            <nav className="flex space-x-6 mb-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("createRole")}
                className={clsx(
                  activeTab === "createRole"
                    ? "bg-white text-blue-600 shadow-lg shadow-blue-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-md",
                  "px-6 py-3 font-medium text-sm rounded-xl inline-flex items-center transition-all duration-200"
                )}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Create Role
              </button>
              <button
                onClick={() => setActiveTab("addUser")}
                className={clsx(
                  activeTab === "addUser"
                    ? "bg-white text-blue-600 shadow-lg shadow-blue-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-md",
                  "px-6 py-3 font-medium text-sm rounded-xl inline-flex items-center transition-all duration-200"
                )}
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Add User
              </button>
            </nav>
          </div>

          {/* Forms */}
          <div className="space-y-8">
            {activeTab === "createRole" && (
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                <div className="px-6 py-8 sm:p-10">
                  <form onSubmit={handleRoleSubmit} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Role Name
                      </label>
                      <input
                        type="text"
                        className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out hover:shadow-md"
                        placeholder="Enter role name"
                        value={newRole.name}
                        onChange={(e) =>
                          setNewRole({ ...newRole, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Permissions
                      </h3>
                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-base font-medium text-gray-900 mb-4">
                            Client Management
                          </h4>
                          <div className="grid gap-6">
                            {Object.entries(
                              newRole.permissions.clientManagement
                            ).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm"
                              >
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                                <div className="flex gap-6">
                                  <label className="inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                                      checked={value.editor}
                                      onChange={(e) =>
                                        setNewRole({
                                          ...newRole,
                                          permissions: {
                                            ...newRole.permissions,
                                            clientManagement: {
                                              ...newRole.permissions
                                                .clientManagement,
                                              [key]: {
                                                ...value,
                                                editor: e.target.checked,
                                              },
                                            },
                                          },
                                        })
                                      }
                                    />
                                    <span className="ml-2 text-sm font-medium text-gray-700">
                                      Editor
                                    </span>
                                  </label>
                                  <label className="inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                                      checked={value.viewer}
                                      onChange={(e) =>
                                        setNewRole({
                                          ...newRole,
                                          permissions: {
                                            ...newRole.permissions,
                                            clientManagement: {
                                              ...newRole.permissions
                                                .clientManagement,
                                              [key]: {
                                                ...value,
                                                viewer: e.target.checked,
                                              },
                                            },
                                          },
                                        })
                                      }
                                    />
                                    <span className="ml-2 text-sm font-medium text-gray-700">
                                      Viewer
                                    </span>
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-base font-medium text-gray-900 mb-4">
                            Additional Permissions
                          </h4>
                          <div className="grid gap-4">
                            {[
                              "documentManagement",
                              "renewalManagement",
                              "complianceManagement",
                              "requestService",
                              "userManagement",
                            ].map((permission) => (
                              <div
                                key={permission}
                                className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                              >
                                <UserGroupIcon className="h-5 w-5 text-gray-500 mr-3" />
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                                  checked={newRole.permissions[permission]}
                                  onChange={(e) =>
                                    setNewRole({
                                      ...newRole,
                                      permissions: {
                                        ...newRole.permissions,
                                        [permission]: e.target.checked,
                                      },
                                    })
                                  }
                                />
                                <span className="ml-3 text-sm font-medium text-gray-900 capitalize">
                                  {permission.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-700 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Create Role
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "addUser" && (
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                <div className="px-6 py-8 sm:p-10">
                  <form onSubmit={handleUserSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out hover:shadow-md"
                          placeholder="Enter full name"
                          value={newUser.name}
                          onChange={(e) =>
                            setNewUser({ ...newUser, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out hover:shadow-md"
                          placeholder="Enter email address"
                          value={newUser.email}
                          onChange={(e) =>
                            setNewUser({ ...newUser, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out hover:shadow-md"
                        placeholder="Enter password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Role
                      </label>
                      <select
                        className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out hover:shadow-md"
                        value={newUser.roleId}
                        onChange={(e) =>
                          setNewUser({ ...newUser, roleId: e.target.value })
                        }
                      >
                        <option value="">Select a role</option>
                        {roles.map((role) => (
                          <option key={role._id} value={role._id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <p className="text-sm text-gray-500 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        User will receive login credentials via email
                      </p>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-700 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Add User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="mt-12">
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Users</h2>
              <div className="relative mt-4 sm:mt-0">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full sm:w-64 rounded-lg border-0 py-2 px-4 shadow-sm ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-600 placeholder-gray-400 transition-all duration-200 ease-in-out hover:shadow-md"
                />
                <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Role
                    </th>
                    {Object.keys(newRole.permissions.clientManagement).map(
                      (key) => (
                        <th
                          key={key}
                          className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                        >
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </th>
                      )
                    )}
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Document Management
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Renewal Management
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Compliance Management
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Request Service
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      User Management
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="whitespace-nowrap px-3 py-4">
                        <span
                          className={clsx(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            user.role?.name === "Operation Management"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          )}
                        >
                          {user.role?.name || "Unknown Role"}
                        </span>
                      </td>
                      {Object.keys(newRole.permissions.clientManagement).map(
                        (key) => (
                          <td key={key} className="whitespace-nowrap px-3 py-4">
                            <div className="flex space-x-4">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={
                                    user.role?.permissions?.clientManagement?.[
                                      key
                                    ]?.editor || false
                                  }
                                  disabled
                                />
                                <span className="ml-2 text-xs text-gray-500">
                                  Edit
                                </span>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={
                                    user.role?.permissions?.clientManagement?.[
                                      key
                                    ]?.viewer || false
                                  }
                                  disabled
                                />
                                <span className="ml-2 text-xs text-gray-500">
                                  View
                                </span>
                              </div>
                            </div>
                          </td>
                        )
                      )}
                      <td className="whitespace-nowrap px-3 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            user.role?.permissions?.documentManagement || false
                          }
                          disabled
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            user.role?.permissions?.renewalManagement || false
                          }
                          disabled
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            user.role?.permissions?.complianceManagement ||
                            false
                          }
                          disabled
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            user.role?.permissions?.requestService || false
                          }
                          disabled
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            user.role?.permissions?.userManagement || false
                          }
                          disabled
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
