import { useState, useEffect, useRef } from "react";
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
  PencilSquareIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import axiosInstance from "../../utils/axios";
import SignatureCanvas from "react-signature-canvas";
import { useAuth } from "../../context/AuthContext";

function UserManagement() {
  const { user: currentUser } = useAuth();

  // Check if current user is admin
  const isAdmin = currentUser?.role?.name?.toLowerCase() === "admin";

  // Check if current user has any signing permission (LMRO, DLMRO, CEO)
  const hasSigningPermission =
    currentUser?.role?.permissions?.kycManagement?.lmro ||
    currentUser?.role?.permissions?.kycManagement?.dlmro ||
    currentUser?.role?.permissions?.kycManagement?.ceo;

  // Set default tab based on user role
  const [activeTab, setActiveTab] = useState(isAdmin ? "createRole" : "signatures");
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [showUserDeleteConfirm, setShowUserDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [signatureUsers, setSignatureUsers] = useState([]);
  const [drawingSignatureFor, setDrawingSignatureFor] = useState(null);
  const [signatureSaving, setSignatureSaving] = useState(false);
  const [signatureMode, setSignatureMode] = useState("draw"); // "draw" or "upload"
  const [uploadPreview, setUploadPreview] = useState(null);
  const signatureCanvasRef = useRef(null);
  const signatureFileInputRef = useRef(null);

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
      operationManagement: false,
      accountManagement: false, // Added Account Management permission
      kycManagement: {
        amlSupervisor: false,
        lmro: false,
        dlmro: false,
        ceo: false,
      },
      // Add BRA Management permissions
      braManagement: {
        lmro: false,
        dlmro: false,
        ceo: false,
      },
      // Compliance Resources permissions
      complianceResources: {
        manage: false,
      },
    },
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });

  // Set default tab based on user role
  useEffect(() => {
    if (currentUser) {
      if (!isAdmin && hasSigningPermission) {
        setActiveTab("signatures");
      } else if (isAdmin) {
        setActiveTab("createRole");
      }
    }
  }, [currentUser, isAdmin, hasSigningPermission]);

  // Fetch roles and users from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch roles and users if admin
        if (isAdmin) {
          const rolesResponse = await axiosInstance.get("/roles");
          setRoles(rolesResponse.data);
          const usersResponse = await axiosInstance.get("/users");
          setUsers(usersResponse.data);
        }
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch data from server"
        );
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

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
          operationManagement: false,
          accountManagement: false, // Reset Account Management permission
          kycManagement: {
            amlSupervisor: false,
            lmro: false,
            dlmro: false,
            ceo: false,
          },
          braManagement: {
            lmro: false,
            dlmro: false,
            ceo: false,
          },
          complianceResources: {
            manage: false,
          },
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

      if (!roleToEdit.permissions.kycManagement) {
        roleToEdit.permissions.kycManagement = {
          amlSupervisor: false,
          lmro: false,
          dlmro: false,
          ceo: false,
        };
      }
      if (roleToEdit.permissions.kycManagement && roleToEdit.permissions.kycManagement.amlSupervisor === undefined) {
        roleToEdit.permissions.kycManagement.amlSupervisor = false;
      }

      // Ensure braManagement exists in the data structure
      if (!roleToEdit.permissions.braManagement) {
        roleToEdit.permissions.braManagement = {
          lmro: false,
          dlmro: false,
          ceo: false,
        };
      }

      // Ensure complianceResources exists in the data structure
      if (!roleToEdit.permissions.complianceResources) {
        roleToEdit.permissions.complianceResources = {
          manage: false,
        };
      }

      // Ensure accountManagement exists
      if (roleToEdit.permissions.accountManagement === undefined) {
        roleToEdit.permissions.accountManagement = false;
      }

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

  // Confirm user deletion
  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
    setShowUserDeleteConfirm(true);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await axiosInstance.delete(`/users/${userToDelete._id}`);

      // Update users list after successful deletion
      setUsers(users.filter((user) => user._id !== userToDelete._id));

      // Reset state
      setUserToDelete(null);
      setShowUserDeleteConfirm(false);

      alert("User deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
      alert(
        "Error: " + (err.response?.data?.message || "Failed to delete user")
      );
    }
  };

  // Check if user has admin role
  const isAdminUser = (user) => {
    const userRole = roles.find(
      (role) => role._id === user.role?._id || role._id === user.roleId
    );
    return userRole?.name?.toLowerCase() === "admin";
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
      "Account Management": "bg-amber-100 text-amber-800",
      Admin: "bg-red-100 text-red-800",
    };
    return colors[roleName] || "bg-gray-100 text-gray-800";
  };

  // Fetch signature users function
  const fetchSignatureUsers = async () => {
    try {
      if (isAdmin) {
        // Admin can see all users with signing permissions
        const response = await axiosInstance.get("/users/with-signature-permissions");
        setSignatureUsers(Array.isArray(response.data) ? response.data : []);
      } else if (hasSigningPermission && currentUser) {
        // Non-admin with signing permission can only see their own data
        const response = await axiosInstance.get("/users/me");
        setSignatureUsers(response.data ? [response.data] : []);
      } else {
        setSignatureUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch signature users:", err);
      setSignatureUsers([]);
    }
  };

  // useEffect for fetching signature users - MUST be before early returns
  useEffect(() => {
    if (activeTab === "signatures") {
      fetchSignatureUsers();
    }
  }, [activeTab, isAdmin, hasSigningPermission, currentUser]);

  // Save signature from canvas
  const handleSaveSignature = async (userId) => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      alert("Please draw your signature first");
      return;
    }

    setSignatureSaving(true);

    try {
      const canvas = signatureCanvasRef.current.getCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      const formData = new FormData();
      formData.append("signature", blob, "signature.png");

      await axiosInstance.put(`/users/${userId}/signature`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Signature saved successfully!");
      setDrawingSignatureFor(null);
      fetchSignatureUsers();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Failed to save signature"));
    } finally {
      setSignatureSaving(false);
    }
  };

  // Clear the signature canvas
  const handleClearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  // Signature delete handler
  const handleDeleteSignature = async (userId) => {
    if (!confirm("Are you sure you want to delete this signature?")) return;

    try {
      await axiosInstance.delete(`/users/${userId}/signature`);
      alert("Signature deleted successfully!");
      fetchSignatureUsers();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Failed to delete signature"));
    }
  };

  // Remove background from signature image (keep only dark pixels)
  const removeSignatureBackground = (imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Sample corners to detect background color
        const getPixel = (x, y) => {
          const i = (y * width + x) * 4;
          return { r: data[i], g: data[i + 1], b: data[i + 2] };
        };

        // Get colors from corners (10 pixels in from each corner)
        const margin = Math.min(10, Math.floor(width / 10), Math.floor(height / 10));
        const corners = [
          getPixel(margin, margin),
          getPixel(width - margin - 1, margin),
          getPixel(margin, height - margin - 1),
          getPixel(width - margin - 1, height - margin - 1),
        ];

        // Average corner colors to get background color
        const bgColor = {
          r: Math.round(corners.reduce((sum, c) => sum + c.r, 0) / 4),
          g: Math.round(corners.reduce((sum, c) => sum + c.g, 0) / 4),
          b: Math.round(corners.reduce((sum, c) => sum + c.b, 0) / 4),
        };

        // Color distance function
        const colorDistance = (r, g, b) => {
          return Math.sqrt(
            Math.pow(r - bgColor.r, 2) +
            Math.pow(g - bgColor.g, 2) +
            Math.pow(b - bgColor.b, 2)
          );
        };

        // Tolerance for background detection (adjust this for sensitivity)
        // Higher = more aggressive background removal
        const tolerance = 60;

        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const distance = colorDistance(r, g, b);

          if (distance < tolerance) {
            // Background pixel - make transparent
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
          } else {
            // Signature pixel - make it dark/black
            const darkness = Math.min(255, distance * 2);
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = Math.min(255, Math.max(darkness, 150));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        console.error("Failed to load image for processing");
        resolve(imageDataUrl);
      };
      img.src = imageDataUrl;
    });
  };

  // Handle file selection for signature upload
  const handleSignatureFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Remove background from the signature
        const processedImage = await removeSignatureBackground(reader.result);
        setUploadPreview(processedImage);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert data URL to Blob
  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Upload signature from file (with background removed)
  const handleUploadSignature = async (userId) => {
    if (!uploadPreview) {
      alert("Please select a signature image first");
      return;
    }

    setSignatureSaving(true);

    try {
      // Convert processed image (data URL) to Blob
      const blob = dataURLtoBlob(uploadPreview);

      const formData = new FormData();
      formData.append("signature", blob, "signature.png");

      await axiosInstance.put(`/users/${userId}/signature`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Signature uploaded successfully!");
      setDrawingSignatureFor(null);
      setUploadPreview(null);
      setSignatureMode("draw");
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = "";
      }
      fetchSignatureUsers();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Failed to upload signature"));
    } finally {
      setSignatureSaving(false);
    }
  };

  // Reset signature mode when closing
  const handleCancelSignature = () => {
    setDrawingSignatureFor(null);
    setSignatureMode("draw");
    setUploadPreview(null);
    if (signatureFileInputRef.current) {
      signatureFileInputRef.current.value = "";
    }
  };

  // Check if role is admin
  const isAdminRole = (role) => {
    return role.name.toLowerCase() === "admin";
  };

  // Get empty role state for form reset
  const getEmptyRoleState = () => ({
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
      operationManagement: false,
      accountManagement: false,
      kycManagement: {
        amlSupervisor: false,
        lmro: false,
        dlmro: false,
        ceo: false,
      },
      braManagement: {
        lmro: false,
        dlmro: false,
        ceo: false,
      },
      complianceResources: {
        manage: false,
      },
    },
  });

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

  // Access denied for users without proper permissions
  if (!isAdmin && !hasSigningPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                {isAdmin ? (
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                ) : (
                  <PencilSquareIcon className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                  {isAdmin ? "User Management" : "Digital Signature"}
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  {isAdmin
                    ? "Manage user roles and permissions for your organization"
                    : "Manage your digital signature for KYC document signing"}
                </p>
              </div>
            </div>
          </div>
          {isAdmin && (
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
          )}
        </div>

        <div className="mt-12">
          <div className="sm:hidden">
            <select
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {isAdmin && <option value="createRole">Create Role</option>}
              {isAdmin && <option value="addUser">Add User</option>}
              {(isAdmin || hasSigningPermission) && <option value="signatures">My Signature</option>}
            </select>
          </div>

          <div className="hidden sm:block">
            <nav className="flex space-x-6 mb-8" aria-label="Tabs">
              {isAdmin && (
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
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab("addUser");
                    setSelectedRoleId(null);
                    setNewRole(getEmptyRoleState());
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
              )}
              {(isAdmin || hasSigningPermission) && (
                <button
                  onClick={() => {
                    setActiveTab("signatures");
                    setSelectedRoleId(null);
                    setNewRole(getEmptyRoleState());
                  }}
                  className={clsx(
                    activeTab === "signatures"
                      ? "bg-white text-blue-600 shadow-lg shadow-blue-100/50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-md",
                    "px-6 py-3 font-medium text-sm rounded-xl inline-flex items-center transition-all duration-200"
                  )}
                >
                  <PencilSquareIcon className="h-5 w-5 mr-2" />
                  {isAdmin ? "Signatures" : "My Signature"}
                </button>
              )}
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

                        {/* KYC Management Section */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-base font-medium text-gray-900 mb-4">
                            KYC Management
                          </h4>
                          <div className="grid gap-4">
                            {Object.entries(
                              newRole.permissions.kycManagement || {
                                amlSupervisor: false,
                                lmro: false,
                                dlmro: false,
                                ceo: false,
                              }
                            ).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                              >
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                                  checked={value}
                                  onChange={(e) =>
                                    setNewRole({
                                      ...newRole,
                                      permissions: {
                                        ...newRole.permissions,
                                        kycManagement: {
                                          ...newRole.permissions.kycManagement,
                                          [key]: e.target.checked,
                                        },
                                      },
                                    })
                                  }
                                />
                                <span className="ml-3 text-sm font-medium text-gray-900 capitalize">
                                  {key === "amlSupervisor"
                                    ? "AML Supervisor (Initial Document Upload)"
                                    : key === "dlmro"
                                    ? "DLMRO (Level 1 KYC Signing)"
                                    : key === "lmro"
                                    ? "LMRO (Level 2 KYC Signing)"
                                    : "CEO (Final KYC Signing)"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* BRA Management Section */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-base font-medium text-gray-900 mb-4">
                            BRA Management
                          </h4>
                          <div className="grid gap-4">
                            {Object.entries(
                              newRole.permissions.braManagement || {
                                lmro: false,
                                dlmro: false,
                                ceo: false,
                              }
                            ).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                              >
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                                  checked={value}
                                  onChange={(e) =>
                                    setNewRole({
                                      ...newRole,
                                      permissions: {
                                        ...newRole.permissions,
                                        braManagement: {
                                          ...newRole.permissions.braManagement,
                                          [key]: e.target.checked,
                                        },
                                      },
                                    })
                                  }
                                />
                                <span className="ml-3 text-sm font-medium text-gray-900 capitalize">
                                  {key === "lmro"
                                    ? "LMRO (Level 1 BRA Approval)"
                                    : key === "dlmro"
                                    ? "DLMRO (Level 2 BRA Approval)"
                                    : "CEO (Final BRA Approval)"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Compliance Resources Section */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-base font-medium text-gray-900 mb-4">
                            Compliance Resources
                          </h4>
                          <div className="grid gap-4">
                            <div className="flex items-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                                checked={newRole.permissions.complianceResources?.manage || false}
                                onChange={(e) =>
                                  setNewRole({
                                    ...newRole,
                                    permissions: {
                                      ...newRole.permissions,
                                      complianceResources: {
                                        ...newRole.permissions.complianceResources,
                                        manage: e.target.checked,
                                      },
                                    },
                                  })
                                }
                              />
                              <span className="ml-3 text-sm font-medium text-gray-900">
                                Manage Resources (Upload, Edit, Delete documents/links)
                              </span>
                            </div>
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
                              "operationManagement",
                              "accountManagement", // Added Account Management permission
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
                            setNewRole(getEmptyRoleState());
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

            {activeTab === "signatures" && (
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="px-6 py-8 sm:p-10">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isAdmin ? "Digital Signatures" : "My Digital Signature"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {isAdmin
                        ? "Create and manage digital signatures for users with KYC signing permissions (DMLRO, MLRO, SEF)"
                        : "Create your digital signature for signing KYC documents. Your signature will be used when you approve documents."}
                    </p>
                  </div>

                  {signatureUsers.length === 0 && isAdmin ? (
                    <div className="text-center py-12">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No signature users</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No users with DMLRO, MLRO, or SEF permissions found.
                      </p>
                    </div>
                  ) : signatureUsers.length === 0 && !isAdmin ? (
                    <div className="max-w-md mx-auto">
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="text-center mb-6">
                          <PencilSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Create Your Signature</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Draw or upload your signature to use for signing KYC documents.
                          </p>
                        </div>

                        {/* Draw/Upload Tabs for non-admin */}
                        <div className="flex mb-4 bg-white rounded-lg p-1 border border-gray-200">
                          <button
                            onClick={() => setSignatureMode("draw")}
                            className={clsx(
                              "flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                              signatureMode === "draw"
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <PencilSquareIcon className="h-4 w-4 mr-1" />
                            Draw
                          </button>
                          <button
                            onClick={() => setSignatureMode("upload")}
                            className={clsx(
                              "flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                              signatureMode === "upload"
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                            Upload
                          </button>
                        </div>

                        {signatureMode === "draw" ? (
                          <>
                            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-2">
                              <SignatureCanvas
                                ref={signatureCanvasRef}
                                canvasProps={{
                                  width: 400,
                                  height: 150,
                                  className: "w-full rounded-lg",
                                  style: { background: "#fff" },
                                }}
                                penColor="black"
                              />
                            </div>
                            <div className="mt-4 flex gap-3">
                              <button
                                onClick={() => signatureCanvasRef.current?.clear()}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => handleSaveSignature(currentUser._id)}
                                disabled={signatureSaving}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-colors disabled:opacity-50"
                              >
                                {signatureSaving ? "Saving..." : "Save Signature"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
                              <input
                                type="file"
                                ref={signatureFileInputRef}
                                accept="image/*"
                                onChange={handleSignatureFileChange}
                                className="hidden"
                                id="signature-upload-self"
                              />
                              {uploadPreview ? (
                                <div className="space-y-3">
                                  <div className="flex justify-center">
                                    <div
                                      className="border border-gray-200 rounded-lg p-2"
                                      style={{
                                        background: "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 16px 16px"
                                      }}
                                    >
                                      <img
                                        src={uploadPreview}
                                        alt="Signature preview"
                                        className="max-h-32 object-contain"
                                      />
                                    </div>
                                  </div>
                                  <p className="text-xs text-center text-green-600">Background removed</p>
                                  <button
                                    onClick={() => {
                                      setUploadPreview(null);
                                      if (signatureFileInputRef.current) {
                                        signatureFileInputRef.current.value = "";
                                      }
                                    }}
                                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                                  >
                                    Remove and choose another
                                  </button>
                                </div>
                              ) : (
                                <label
                                  htmlFor="signature-upload-self"
                                  className="flex flex-col items-center justify-center cursor-pointer py-6"
                                >
                                  <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-2" />
                                  <span className="text-sm font-medium text-gray-600">
                                    Click to upload signature image
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    PNG, JPG up to 5MB
                                  </span>
                                </label>
                              )}
                            </div>
                            <div className="mt-4 flex gap-3">
                              <button
                                onClick={() => {
                                  setUploadPreview(null);
                                  if (signatureFileInputRef.current) {
                                    signatureFileInputRef.current.value = "";
                                  }
                                }}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => handleUploadSignature(currentUser._id)}
                                disabled={signatureSaving || !uploadPreview}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-colors disabled:opacity-50"
                              >
                                {signatureSaving ? "Uploading..." : "Upload Signature"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {signatureUsers.map((user) => (
                        <div
                          key={user._id}
                          className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{user.name}</h4>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {user.role?.permissions?.kycManagement?.dlmro && (
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    DMLRO
                                  </span>
                                )}
                                {user.role?.permissions?.kycManagement?.lmro && (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                    MLRO
                                  </span>
                                )}
                                {user.role?.permissions?.kycManagement?.ceo && (
                                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                                    SEF
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 pt-4">
                            {user.signatureImage?.fileUrl ? (
                              <div className="space-y-3">
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <img
                                    src={user.signatureImage.fileUrl}
                                    alt={`${user.name}'s signature`}
                                    className="max-h-20 mx-auto object-contain"
                                  />
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                  Created: {new Date(user.signatureImage.uploadedAt).toLocaleDateString()}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setDrawingSignatureFor(user._id)}
                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                                    Redraw
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSignature(user._id)}
                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                  >
                                    <TrashIcon className="h-4 w-4 mr-1" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                                  <PencilSquareIcon className="h-10 w-10 text-gray-400" />
                                  <p className="mt-2 text-sm text-gray-500">No signature</p>
                                </div>
                                <button
                                  onClick={() => setDrawingSignatureFor(user._id)}
                                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-colors"
                                >
                                  <PencilSquareIcon className="h-4 w-4 mr-2" />
                                  Create Signature
                                </button>
                              </div>
                            )}

                            {drawingSignatureFor === user._id && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                {/* Draw/Upload Tabs */}
                                <div className="flex mb-4 bg-white rounded-lg p-1 border border-gray-200">
                                  <button
                                    onClick={() => setSignatureMode("draw")}
                                    className={clsx(
                                      "flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                      signatureMode === "draw"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                    )}
                                  >
                                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                                    Draw
                                  </button>
                                  <button
                                    onClick={() => setSignatureMode("upload")}
                                    className={clsx(
                                      "flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                      signatureMode === "upload"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                    )}
                                  >
                                    <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                                    Upload
                                  </button>
                                </div>

                                {signatureMode === "draw" ? (
                                  <>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Draw signature below
                                    </label>
                                    <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                                      <SignatureCanvas
                                        ref={signatureCanvasRef}
                                        penColor="black"
                                        canvasProps={{
                                          width: 280,
                                          height: 120,
                                          className: "signature-canvas w-full"
                                        }}
                                        backgroundColor="white"
                                      />
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                      <button
                                        onClick={handleClearSignature}
                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                      >
                                        Clear
                                      </button>
                                      <button
                                        onClick={() => handleSaveSignature(user._id)}
                                        disabled={signatureSaving}
                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        {signatureSaving ? "Saving..." : "Save Signature"}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Upload signature image
                                    </label>
                                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
                                      <input
                                        type="file"
                                        ref={signatureFileInputRef}
                                        accept="image/*"
                                        onChange={handleSignatureFileChange}
                                        className="hidden"
                                        id={`signature-upload-${user._id}`}
                                      />
                                      {uploadPreview ? (
                                        <div className="space-y-3">
                                          <div className="flex justify-center">
                                            <div
                                              className="border border-gray-200 rounded-lg p-2"
                                              style={{
                                                background: "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 16px 16px"
                                              }}
                                            >
                                              <img
                                                src={uploadPreview}
                                                alt="Signature preview"
                                                className="max-h-24 object-contain"
                                              />
                                            </div>
                                          </div>
                                          <p className="text-xs text-center text-green-600">Background removed</p>
                                          <button
                                            onClick={() => {
                                              setUploadPreview(null);
                                              if (signatureFileInputRef.current) {
                                                signatureFileInputRef.current.value = "";
                                              }
                                            }}
                                            className="w-full text-sm text-gray-500 hover:text-gray-700"
                                          >
                                            Remove and choose another
                                          </button>
                                        </div>
                                      ) : (
                                        <label
                                          htmlFor={`signature-upload-${user._id}`}
                                          className="flex flex-col items-center justify-center cursor-pointer py-4"
                                        >
                                          <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                                          <span className="text-sm font-medium text-gray-600">
                                            Click to upload signature
                                          </span>
                                          <span className="text-xs text-gray-400 mt-1">
                                            PNG, JPG up to 5MB
                                          </span>
                                        </label>
                                      )}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                      <button
                                        onClick={() => {
                                          setUploadPreview(null);
                                          if (signatureFileInputRef.current) {
                                            signatureFileInputRef.current.value = "";
                                          }
                                        }}
                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                      >
                                        Clear
                                      </button>
                                      <button
                                        onClick={() => handleUploadSignature(user._id)}
                                        disabled={signatureSaving || !uploadPreview}
                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        {signatureSaving ? "Uploading..." : "Upload Signature"}
                                      </button>
                                    </div>
                                  </>
                                )}
                                <button
                                  onClick={handleCancelSignature}
                                  className="w-full mt-2 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                        Object.values(role.permissions).filter((permission) => {
                          if (typeof permission === "boolean") {
                            return permission;
                          } else if (
                            permission === null ||
                            permission === undefined
                          ) {
                            return false;
                          } else if (typeof permission === "object") {
                            if (
                              Object.keys(permission).includes("editor") &&
                              Object.keys(permission).includes("viewer")
                            ) {
                              return permission.editor || permission.viewer;
                            } else {
                              return Object.values(permission).some(
                                (val) => val === true
                              );
                            }
                          }
                          return false;
                        }).length
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
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[150px] border-r border-gray-200"
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
                      {/* KYC Management columns */}
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        KYC LMRO
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        KYC DLMRO
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        KYC CEO
                      </th>
                      {/* BRA Management columns */}
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gray-100"
                      >
                        BRA LMRO
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gray-100"
                      >
                        BRA DLMRO
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gray-100"
                      >
                        BRA CEO
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider bg-orange-100"
                      >
                        Resources
                      </th>
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
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        Operation Management
                      </th>
                      {/* Account Management column */}
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-amber-50"
                      >
                        Account Management
                      </th>
                      {/* Actions column */}
                      <th
                        scope="col"
                        className="px-3 py-4 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 min-w-[80px] border-l border-gray-200"
                      >
                        Actions
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
                          <td className="whitespace-nowrap px-3 py-4 sticky left-0 bg-white z-10 min-w-[150px] border-r border-gray-200">
                            <span className="font-medium text-gray-900">{user.name}</span>
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
                          {/* KYC Management permissions */}
                          <td className="whitespace-nowrap px-3 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={
                                userRole?.permissions?.kycManagement?.lmro ||
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
                                userRole?.permissions?.kycManagement?.dlmro ||
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
                                userRole?.permissions?.kycManagement?.ceo ||
                                false
                              }
                              disabled
                            />
                          </td>
                          {/* BRA Management permissions */}
                          <td className="whitespace-nowrap px-3 py-4 bg-gray-50">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={
                                userRole?.permissions?.braManagement?.lmro ||
                                false
                              }
                              disabled
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 bg-gray-50">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={
                                userRole?.permissions?.braManagement?.dlmro ||
                                false
                              }
                              disabled
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 bg-gray-50">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={
                                userRole?.permissions?.braManagement?.ceo ||
                                false
                              }
                              disabled
                            />
                          </td>
                          {/* Compliance Resources permission */}
                          <td className="whitespace-nowrap px-3 py-4 bg-orange-50">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              checked={
                                userRole?.permissions?.complianceResources?.manage ||
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
                          <td className="whitespace-nowrap px-3 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={
                                userRole?.permissions?.operationManagement ||
                                false
                              }
                              disabled
                            />
                          </td>
                          {/* Account Management permission */}
                          <td className="whitespace-nowrap px-3 py-4 bg-amber-50">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                              checked={
                                userRole?.permissions?.accountManagement ||
                                false
                              }
                              disabled
                            />
                          </td>
                          {/* Actions column */}
                          <td className="whitespace-nowrap px-3 py-4 text-center sticky right-0 bg-white z-10 min-w-[80px] border-l border-gray-200">
                            <button
                              onClick={() => confirmDeleteUser(user)}
                              className={clsx(
                                "p-2 rounded-lg transition-colors duration-200",
                                isAdminUser(user)
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                              )}
                              disabled={isAdminUser(user)}
                              title={
                                isAdminUser(user)
                                  ? "Cannot delete: Admin users are protected"
                                  : `Delete "${user.name}"`
                              }
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
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

      {/* User Delete Confirmation Modal */}
      {showUserDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete User
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete user{" "}
                    <span className="font-semibold">{userToDelete?.name}</span>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleDeleteUser}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => {
                  setShowUserDeleteConfirm(false);
                  setUserToDelete(null);
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
