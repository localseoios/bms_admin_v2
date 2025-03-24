import { useState, useEffect } from "react";
import {
  UserPlusIcon,
  UserGroupIcon,
  CheckCircleIcon,
  PencilIcon,
  ShieldCheckIcon,
  UsersIcon,
  KeyIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import axiosInstance from "../../utils/axios";

function UserManagement() {
  const [activeTab, setActiveTab] = useState("createRole");
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

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

  // Handle role submission (create or update)
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRoleId) {
        // Update existing role
        const response = await axiosInstance.put(
          `/roles/${selectedRoleId}`,
          newRole
        );
        setRoles(
          roles.map((role) =>
            role._id === selectedRoleId ? response.data : role
          )
        );
        setSelectedRoleId(null);
        alert("Role updated successfully!");
      } else {
        // Create new role
        const response = await axiosInstance.post("/roles", newRole);
        setRoles([...roles, response.data]);
        alert("Role created successfully!");
      }

      // Reset form
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
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save role");
      alert("Error: " + (err.response?.data?.message || "Failed to save role"));
    }
  };

  // Handle role editing
  const handleEditRole = async (roleId) => {
    try {
      const response = await axiosInstance.get(`/roles/${roleId}`);
      const roleToEdit = response.data;

      setNewRole(roleToEdit);
      setSelectedRoleId(roleId);
      setActiveTab("createRole");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch role details");
      alert(
        "Error: " +
          (err.response?.data?.message || "Failed to fetch role details")
      );
    }
  };

  // Confirm role deletion
  const confirmDeleteRole = (roleId) => {
    setRoleToDelete(roleId);
    setShowDeleteConfirm(true);
  };

  // Handle role deletion
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await axiosInstance.delete(`/roles/${roleToDelete}`);

      // Update roles list after successful deletion
      setRoles(roles.filter((role) => role._id !== roleToDelete));

      // Reset state
      setRoleToDelete(null);
      setShowDeleteConfirm(false);

      alert("Role deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete role");
      alert(
        "Error: " + (err.response?.data?.message || "Failed to delete role")
      );
    }
  };

  // Handle user creation
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/users", newUser);
      setUsers([...users, response.data]);
      setNewUser({ name: "", email: "", password: "", roleId: "" });
      alert("User added successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add user");
      alert("Error: " + (err.response?.data?.message || "Failed to add user"));
    }
  };

  // Get role color
  const getRoleColor = (roleName) => {
    const colors = {
      "Business Development": "bg-blue-100 text-blue-800",
      "Compliance Management": "bg-purple-100 text-purple-800",
      Accounting: "bg-green-100 text-green-800",
      "Operation Management": "bg-indigo-100 text-indigo-800",
      Admin: "bg-red-100 text-red-800",
    };
    return colors[roleName] || "bg-gray-100 text-gray-800";
  };

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

  // Check if role is admin
  const isAdminRole = (role) => {
    return role.name.toLowerCase() === "admin";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                  User Management
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Manage user roles and permissions for your organization
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex-none">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center">
                <UsersIcon className="h-5 w-5 mr-1 text-gray-400" />
                <span>{users.length} Users</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <KeyIcon className="h-5 w-5 mr-1 text-gray-400" />
                <span>{roles.length} Roles</span>
              </div>
            </div>
          </div>
        </div>

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
                    ? "bg-white text-blue-600 shadow-lg shadow-blue-100/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-md",
                  "px-6 py-3 font-medium text-sm rounded-xl inline-flex items-center transition-all duration-200"
                )}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                {selectedRoleId ? "Update Role" : "Create Role"}
              </button>
              <button
                onClick={() => {
                  setActiveTab("addUser");
                  setSelectedRoleId(null);
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
                }}
                className={clsx(
                  activeTab === "addUser"
                    ? "bg-white text-blue-600 shadow-lg shadow-blue-100/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-md",
                  "px-6 py-3 font-medium text-sm rounded-xl inline-flex items-center transition-all duration-200"
                )}
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Add User
              </button>
            </nav>
          </div>

          <div className="space-y-8">
            {activeTab === "createRole" && (
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="px-6 py-8 sm:p-10">
                  <form onSubmit={handleRoleSubmit} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Role Name
                      </label>
                      <input
                        type="text"
                        className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow duration-200"
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
                                className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
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
                                className="flex items-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                              >
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
                      {selectedRoleId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoleId(null);
                            setNewRole({
                              name: "",
                              permissions: {
                                clientManagement: {
                                  companyDetails: {
                                    editor: false,
                                    viewer: false,
                                  },
                                  directorDetails: {
                                    editor: false,
                                    viewer: false,
                                  },
                                  secretaryDetails: {
                                    editor: false,
                                    viewer: false,
                                  },
                                  shareholderDetails: {
                                    editor: false,
                                    viewer: false,
                                  },
                                  sefDetails: { editor: false, viewer: false },
                                  signedKyc: { editor: false, viewer: false },
                                  paymentDetails: {
                                    editor: false,
                                    viewer: false,
                                  },
                                  auditedFinancial: {
                                    editor: false,
                                    viewer: false,
                                  },
                                },
                                documentManagement: false,
                                renewalManagement: false,
                                complianceManagement: false,
                                requestService: false,
                                userManagement: false,
                              },
                            });
                          }}
                          className="mr-4 px-8 py-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200"
                      >
                        {selectedRoleId ? "Update Role" : "Create Role"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "addUser" && (
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="px-6 py-8 sm:p-10">
                  <form onSubmit={handleUserSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow duration-200"
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
                          className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow duration-200"
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
                        className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow duration-200"
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
                        className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow duration-200"
                        value={newUser.roleId}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            roleId: e.target.value,
                          })
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
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200"
                      >
                        Add User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Roles List */}
          <div className="mt-12">
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
                <p className="mt-1 text-sm text-gray-600">
                  A list of all roles and their permissions
                </p>
              </div>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <div
                  key={role._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={clsx(
                          "p-2 rounded-lg",
                          getRoleColor(role.name)
                        )}
                      >
                        <ShieldCheckIcon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {role.name}
                      </h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditRole(role._id)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        title="Edit Role"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDeleteRole(role._id)}
                        className={clsx(
                          "p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200",
                          isAdminRole(role)
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-400 hover:text-red-600"
                        )}
                        disabled={isAdminRole(role)}
                        title={
                          isAdminRole(role)
                            ? "Cannot delete: Admin role is protected"
                            : "Delete Role"
                        }
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">Users:</span>
                      {
                        users.filter(
                          (user) =>
                            user.role?._id === role._id ||
                            user.roleId === role._id
                        ).length
                      }
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <KeyIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">Permissions:</span>
                      {
                        Object.values(role.permissions).filter((permission) =>
                          typeof permission === "boolean"
                            ? permission
                            : Object.values(permission).some(
                                (section) => section.editor || section.viewer
                              )
                        ).length
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="mt-12">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Users</h2>
                <p className="mt-1 text-sm text-gray-600">
                  A list of all users and their assigned roles and permissions
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="overflow-x-auto bg-white shadow-xl rounded-2xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      {Object.keys(newRole.permissions.clientManagement).map(
                        (key) => (
                          <th
                            key={key}
                            scope="col"
                            className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                          >
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </th>
                        )
                      )}
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        Document Management
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        Renewal Management
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        Compliance Management
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        Request Service
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        User Management
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {users.map((user, index) => {
                      const userRole = roles.find(
                        (role) =>
                          role._id === user.role?._id ||
                          role._id === user.roleId
                      );
                      return (
                        <tr
                          key={user._id || index}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="whitespace-nowrap px-3 py-4">
                            {user.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <span
                              className={clsx(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                getRoleColor(userRole?.name)
                              )}
                            >
                              {userRole?.name || "Unknown Role"}
                            </span>
                          </td>
                          {Object.entries(
                            newRole.permissions.clientManagement
                          ).map(([key]) => {
                            const permissionValue = userRole?.permissions
                              ?.clientManagement?.[key] || {
                              editor: false,
                              viewer: false,
                            };
                            return (
                              <td
                                key={key}
                                className="whitespace-nowrap px-3 py-4"
                              >
                                <div className="flex space-x-4">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={permissionValue.editor || false}
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
                                      checked={permissionValue.viewer || false}
                                      disabled
                                    />
                                    <span className="ml-2 text-xs text-gray-500">
                                      View
                                    </span>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                          <td className="whitespace-nowrap px-3 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={
                                userRole?.permissions?.documentManagement ||
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
                                userRole?.permissions?.renewalManagement ||
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
                                userRole?.permissions?.complianceManagement ||
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
                                userRole?.permissions?.requestService || false
                              }
                              disabled
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={
                                userRole?.permissions?.userManagement || false
                              }
                              disabled
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Role
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this role? This action
                    cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleDeleteRole}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRoleToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
