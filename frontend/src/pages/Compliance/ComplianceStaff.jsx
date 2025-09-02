import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  HomeIcon,
  CloudArrowUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FolderPlusIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  IdentificationIcon,
  AcademicCapIcon,
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  StarIcon,
  BellIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  ClipboardDocumentCheckIcon,
  CogIcon,
  BanknotesIcon,
  DocumentMagnifyingGlassIcon,
  FireIcon,
  SparklesIcon,
  TrophyIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import {
  ShieldCheckIcon as ShieldCheckIconSolid,
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid,
} from "@heroicons/react/24/solid";

const ComplianceStaff = () => {
  const navigate = useNavigate();
  
  // View states - role selection vs staff list
  const [currentView, setCurrentView] = useState("roles"); // "roles" or "staff"
  const [selectedRoleForView, setSelectedRoleForView] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  
  // Staff data from backend
  const [staffMembers, setStaffMembers] = useState([]);
  const [roleStats, setRoleStats] = useState([]);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [uploadData, setUploadData] = useState({
    description: "",
    file: null,
    expireDate: "",
  });
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceExpireDate, setReplaceExpireDate] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch compliance notification count
  const fetchNotificationCount = async () => {
    try {
      const response = await axios.get('/compliance-notifications/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching compliance notification count:', error);
    }
  };

  // Fetch data from backend
  useEffect(() => {
    if (currentView === "roles") {
      fetchRoleStats();
    } else if (currentView === "staff") {
      fetchStaffMembers();
    }
    fetchNotificationCount();
  }, [currentView]);

  // Poll for notification count every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRoleStats = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/compliance-staff/roles");
      if (response.data.success) {
        setRoleStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching role statistics:", error);
      toast.error("Failed to fetch role statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/compliance-staff");
      if (response.data.success) {
        // Transform the data to include icon components
        const transformedData = response.data.data.map(staff => ({
          ...staff,
          sections: staff.sections.map(section => ({
            ...section,
            icon: getIconComponent(section.icon)
          }))
        }));
        setStaffMembers(transformedData);
      }
    } catch (error) {
      console.error("Error fetching staff members:", error);
      toast.error("Failed to fetch staff members");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get icon component from string
  const getIconComponent = (iconName) => {
    const iconMap = {
      "DocumentChartBarIcon": DocumentChartBarIcon,
      "IdentificationIcon": IdentificationIcon,
      "AcademicCapIcon": AcademicCapIcon,
      "DocumentTextIcon": DocumentTextIcon,
      "DocumentDuplicateIcon": DocumentDuplicateIcon,
      "ShieldCheckIcon": ShieldCheckIcon,
      "BanknotesIcon": BanknotesIcon,
      "ExclamationTriangleIcon": ExclamationTriangleIcon,
      "ScaleIcon": ScaleIcon,
      "ClipboardDocumentCheckIcon": ClipboardDocumentCheckIcon,
      "DocumentMagnifyingGlassIcon": DocumentMagnifyingGlassIcon,
      "UserIcon": UserIcon,
      "UsersIcon": UsersIcon,
      "TrophyIcon": TrophyIcon,
      "EyeIcon": EyeIcon,
      "FolderPlusIcon": FolderPlusIcon,
    };
    return iconMap[iconName] || DocumentTextIcon;
  };

  // Navigation functions
  const handleRoleSelection = (role) => {
    setSelectedRoleForView(role);
    setSelectedRole(role.role);
    setCurrentView("staff");
  };

  const handleBackToRoles = () => {
    setCurrentView("roles");
    setSelectedRoleForView(null);
    setSelectedRole("all");
    setSearchTerm("");
  };

  const colorMap = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-purple-500 to-violet-600",
    orange: "from-orange-500 to-amber-600",
    red: "from-red-500 to-rose-600",
    pink: "from-pink-500 to-rose-600",
    cyan: "from-cyan-500 to-blue-600",
    yellow: "from-yellow-500 to-orange-600",
  };

  const bgColorMap = {
    blue: "bg-blue-50",
    green: "bg-emerald-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
    red: "bg-red-50",
    pink: "bg-pink-50",
    cyan: "bg-cyan-50",
    yellow: "bg-yellow-50",
  };

  // Document management handlers
  const handleUploadClick = (section, staff) => {
    setSelectedSection(section);
    setSelectedStaff(staff);
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    if (!isUploading) {
      setShowUploadModal(false);
      setUploadData({ description: "", file: null, expireDate: "" });
      setIsUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadData.file || !uploadData.description) return;

    console.log('Frontend uploadData:', uploadData);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('staffId', selectedStaff.id);
      formData.append('sectionId', selectedSection._id);
      formData.append('description', uploadData.description);
      if (uploadData.expireDate) {
        console.log('Adding expireDate to formData:', uploadData.expireDate);
        formData.append('expireDate', uploadData.expireDate);
      }

      const response = await axios.post('/compliance-staff/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update local state with the response from backend
        setStaffMembers(staffMembers.map(staff => 
          staff.id === selectedStaff.id
            ? {
                ...staff,
                sections: staff.sections.map(section => 
                  section.id === selectedSection.id
                    ? { ...section, documents: [...section.documents, response.data.data] }
                    : section
                )
              }
            : staff
        ));

        toast.success('Document uploaded successfully');
        setShowUploadModal(false);
        setUploadData({ description: "", file: null, expireDate: "" });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = (document, section, staff) => {
    setSelectedDocument(document);
    setSelectedSection(section);
    setSelectedStaff(staff);
    setShowViewModal(true);
  };

  const handleEditDocument = (document, section, staff) => {
    setSelectedDocument(document);
    setSelectedSection(section);
    setSelectedStaff(staff);
    setShowEditModal(true);
  };

  const handleDeleteClick = (document, section, staff) => {
    setSelectedDocument(document);
    setSelectedSection(section);
    setSelectedStaff(staff);
    setShowDeleteModal(true);
    setDeleteConfirmText("");
  };

  const handleDeleteDocument = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    try {
      setIsUploading(true);
      
      const response = await axios.delete('/compliance-staff/delete-document', {
        data: {
          staffId: selectedStaff.id,
          sectionId: selectedSection._id,
          documentId: selectedDocument.id
        }
      });

      if (response.data.success) {
        // Update local state after successful backend deletion
        setStaffMembers(staffMembers.map(staff => 
          staff.id === selectedStaff.id
            ? {
                ...staff,
                sections: staff.sections.map(section => 
                  section._id === selectedSection._id
                    ? { ...section, documents: section.documents.filter(doc => doc.id !== selectedDocument.id) }
                    : section
                )
              }
            : staff
        ));
        
        toast.success("Document deleted successfully!");
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.message || "Error deleting document");
    } finally {
      setIsUploading(false);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      setSelectedDocument(null);
      setSelectedSection(null);
      setSelectedStaff(null);
    }
  };

  const handleReplaceClick = (document, section, staff) => {
    setSelectedDocument(document);
    setSelectedSection(section);
    setSelectedStaff(staff);
    setShowReplaceModal(true);
    setReplaceFile(null);
    setReplaceExpireDate(document?.expireDate ? new Date(document.expireDate).toISOString().split('T')[0] : "");
  };

  const handleReplaceDocument = async () => {
    if (!replaceFile) return;

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', replaceFile);
      formData.append('staffId', selectedStaff.id);
      formData.append('sectionId', selectedSection._id);
      formData.append('documentId', selectedDocument.id);
      if (replaceExpireDate) {
        formData.append('expireDate', replaceExpireDate);
      }

      const response = await axios.post('/compliance-staff/replace-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const updatedDocument = response.data.data;
        
        // Update local state with the replaced document from backend
        setStaffMembers(staffMembers.map(staff => 
          staff.id === selectedStaff.id
            ? {
                ...staff,
                sections: staff.sections.map(section => 
                  section._id === selectedSection._id
                    ? {
                        ...section,
                        documents: section.documents.map(doc => 
                          doc.id === selectedDocument.id
                            ? updatedDocument
                            : doc
                        )
                      }
                    : section
                )
              }
            : staff
        ));

        toast.success("Document replaced successfully!");
      }
    } catch (error) {
      console.error('Error replacing document:', error);
      toast.error(error.response?.data?.message || "Error replacing document");
    } finally {
      setIsUploading(false);
      setShowReplaceModal(false);
      setReplaceFile(null);
      setReplaceExpireDate("");
      setSelectedDocument(null);
      setSelectedSection(null);
      setSelectedStaff(null);
    }
  };

  const handleUpdateDocument = async (updatedDescription, updatedExpireDate) => {
    try {
      setIsUploading(true);
      
      const response = await axios.put('/compliance-staff/update-document', {
        staffId: selectedStaff.id,
        sectionId: selectedSection._id,
        documentId: selectedDocument.id,
        description: updatedDescription,
        expireDate: updatedExpireDate || null
      });

      if (response.data.success) {
        // Update local state after successful backend update
        setStaffMembers(staffMembers.map(staff => 
          staff.id === selectedStaff.id
            ? {
                ...staff,
                sections: staff.sections.map(section => 
                  section._id === selectedSection._id
                    ? {
                        ...section,
                        documents: section.documents.map(doc => 
                          doc.id === selectedDocument.id
                            ? { ...doc, description: updatedDescription, expireDate: updatedExpireDate || null }
                            : doc
                        )
                      }
                    : section
                )
              }
            : staff
        ));
        
        toast.success("Document updated successfully!");
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error(error.response?.data?.message || "Error updating document");
    } finally {
      setIsUploading(false);
      setShowEditModal(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSection.title || !selectedStaff) return;

    try {
      const response = await axios.post('/compliance-staff/add-section', {
        staffId: selectedStaff.id,
        sectionTitle: newSection.title,
        sectionDescription: newSection.description || "Custom staff document section"
      });

      if (response.data.success) {
        // Update local state with the new section
        setStaffMembers(staffMembers.map(staff => 
          staff.id === selectedStaff.id
            ? {
                ...staff,
                sections: [...staff.sections, response.data.data]
              }
            : staff
        ));

        toast.success('Section added successfully');
        setShowAddSectionModal(false);
        setNewSection({ title: "", description: "" });
      }
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Failed to add section');
    }
  };


  const toggleSectionExpand = (sectionId, staffId) => {
    setStaffMembers(staffMembers.map(staff => 
      staff.id === staffId
        ? {
            ...staff,
            sections: staff.sections.map(section =>
              section.id === sectionId
                ? { ...section, expanded: !section.expanded }
                : section
            )
          }
        : staff
    ));
  };

  // Table functionality
  const toggleRowExpansion = (staffId) => {
    setExpandedRows(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort staff members
  const filteredAndSortedStaff = staffMembers
    .filter(staff => {
      const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           staff.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || staff.role === selectedRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'documents':
          aValue = a.sections.reduce((sum, section) => sum + section.documents.length, 0);
          bValue = b.sections.reduce((sum, section) => sum + section.documents.length, 0);
          break;
        case 'sections':
          aValue = a.sections.length;
          bValue = b.sections.length;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const uniqueRoles = [...new Set(staffMembers.map(staff => staff.role))];

  const getTotalDocuments = (staff) => {
    return staff.sections.reduce((sum, section) => sum + section.documents.length, 0);
  };

  const getStatusColor = (staff) => {
    const totalDocs = getTotalDocuments(staff);
    if (totalDocs === 0) return 'bg-red-100 text-red-800';
    if (totalDocs < 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (staff) => {
    const totalDocs = getTotalDocuments(staff);
    if (totalDocs === 0) return 'No Documents';
    if (totalDocs < 5) return 'Incomplete';
    return 'Complete';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Compliance Manager': return ShieldCheckIconSolid;
      case 'AML Officer': return BanknotesIcon;
      case 'Risk Assessment Specialist': return ExclamationTriangleIcon;
      case 'KYC Specialist': return IdentificationIcon;
      case 'Regulatory Affairs Officer': return ScaleIcon;
      case 'Internal Auditor': return ClipboardDocumentCheckIcon;
      case 'Legal Compliance Advisor': return DocumentMagnifyingGlassIcon;
      default: return ShieldCheckIcon;
    }
  };

  const getRoleColor = (role) => {
    const roleName = role.toLowerCase().trim();
    
    if (roleName === 'admin') return 'from-purple-500 to-violet-600';
    if (roleName === 'operation management') return 'from-emerald-500 to-green-600';
    if (roleName === 'accounting') return 'from-pink-500 to-rose-600';
    if (roleName === 'compliance management') return 'from-cyan-500 to-blue-600';
    if (roleName === 'mlro') return 'from-red-500 to-rose-600';
    if (roleName === 'dmlro') return 'from-orange-500 to-amber-600';
    if (roleName === 'ceo') return 'from-yellow-500 to-orange-600';
    if (roleName === 'external parties') return 'from-blue-500 to-indigo-600';
    
    return 'from-gray-500 to-slate-600';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Compliance Manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'AML Officer': return 'bg-red-100 text-red-800 border-red-200';
      case 'Risk Assessment Specialist': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'KYC Specialist': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Regulatory Affairs Officer': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Internal Auditor': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Legal Compliance Advisor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'Senior': return TrophyIcon;
      case 'Mid-Level': return StarIconSolid;
      case 'Junior': return BeakerIcon;
      default: return UserIcon;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Senior': return 'text-gold-600 bg-gold-50';
      case 'Mid-Level': return 'text-blue-600 bg-blue-50';
      case 'Junior': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentView === "staff") {
                    handleBackToRoles();
                  } else {
                    navigate("/compliance-selection");
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {currentView === "staff" ? "Back to Roles" : "Back"}
                </span>
              </motion.button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {currentView === "roles" ? "Compliance Roles" : 
                   selectedRoleForView ? `${selectedRoleForView.role} Staff` : "Compliance Staff"}
                </h1>
                <p className="text-xs text-gray-500">
                  {currentView === "roles" ? "Select Role to View Staff" : "Staff Document Management"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <button
                  onClick={() => navigate("/compliance-notifications")}
                  className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors relative"
                  title="View Compliance Notifications"
                >
                  <BellIcon className="w-5 h-5 text-gray-600" />
                  {/* Dynamic Notification Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Dashboard Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <HomeIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Dashboard</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "roles" ? (
          // Role Selection View
          <>
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Compliance Roles</h2>
              <p className="text-gray-600">Select a role to view staff members and their documents</p>
            </motion.div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                roleStats.map((role, index) => {
                  const IconComponent = getIconComponent(role.icon);
                  return (
                    <motion.div
                      key={role.role}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleSelection(role)}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 cursor-pointer hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor(role.role)} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                          {role.count}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                        {role.role}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {role.count} {role.count === 1 ? 'member' : 'members'}
                        </span>
                        <div className="flex items-center text-emerald-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                          <span>View Staff</span>
                          <ArrowLeftIcon className="w-4 h-4 ml-1 rotate-180" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          // Staff List View
          <>
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedRoleForView ? `${selectedRoleForView.role} Staff` : 'Compliance Staff Management'}
              </h2>
              <p className="text-gray-600">
                {selectedRoleForView ? `Manage documents for ${selectedRoleForView.role} team members` : 'Manage documents and records for compliance team members'}
              </p>
            </motion.div>

        {/* Search and Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
            
            {/* Role Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <FunnelIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-emerald-600">{filteredAndSortedStaff.length}</span> of {staffMembers.length} staff members
              </div>
            </div>
          </div>
        </motion.div>

        {/* Advanced Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden backdrop-blur-sm bg-white/95"
        >
          {/* Table Header */}
          <div className="bg-slate-600 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Compliance Staff Directory</h3>
                  <p className="text-slate-200 text-sm">Staff Management System</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-200">Professional View</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="group flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      <span>Staff Member</span>
                      <ArrowsUpDownIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('role')}
                      className="group flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      <span>Role</span>
                      <ArrowsUpDownIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleSort('sections')}
                      className="group flex items-center justify-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors w-full"
                    >
                      <span>Sections</span>
                      <ArrowsUpDownIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleSort('documents')}
                      className="group flex items-center justify-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors w-full"
                    >
                      <span>Documents</span>
                      <ArrowsUpDownIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedStaff.map((staff, index) => (
                  <React.Fragment key={staff.id}>
                    {/* Main Row */}
                    <motion.tr
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200 ${
                        expandedRows[staff.id] ? 'bg-gradient-to-r from-emerald-25 to-green-25' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center border border-gray-200">
                              {React.createElement(getRoleIcon(staff.role), { className: "w-6 h-6 text-slate-600" })}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <CheckCircleIcon className="w-2 h-2 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="font-semibold text-gray-900 text-base">{staff.name}</div>
                              {staff.level === 'Senior' && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                                  Senior
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{staff.email}</div>
                            <div className="text-xs text-gray-500">{staff.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-slate-100 text-slate-800 border border-gray-200">
                            {staff.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {staff.sections.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                          {getTotalDocuments(staff)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(staff)}`}>
                          {getStatusText(staff)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedStaff(staff);
                              setShowAddSectionModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                            title="Add Section"
                          >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleRowExpansion(staff.id)}
                            className={`inline-flex items-center px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
                              expandedRows[staff.id] 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            title={expandedRows[staff.id] ? "Hide Details" : "View Details"}
                          >
                            {expandedRows[staff.id] ? (
                              <><ChevronUpIcon className="w-4 h-4 mr-1" />Hide</>
                            ) : (
                              <><ChevronDownIcon className="w-4 h-4 mr-1" />View</>
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expanded Row - Document Sections */}
                    <AnimatePresence>
                      {expandedRows[staff.id] && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gradient-to-r from-gray-50 to-slate-50"
                        >
                          <td colSpan="6" className="px-6 py-4">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2 mb-4">
                                <FolderPlusIcon className="w-5 h-5 text-emerald-600" />
                                <h4 className="text-lg font-semibold text-gray-800">Document Sections for {staff.name}</h4>
                              </div>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {staff.sections.map((section) => (
                                  <div
                                    key={section.id}
                                    className={`${bgColorMap[section.color]} rounded-xl p-4 border border-white shadow-sm hover:shadow-md transition-all`}
                                  >
                                    {/* Section Header */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-start space-x-3">
                                        <div className={`w-10 h-10 bg-gradient-to-br ${colorMap[section.color]} rounded-lg flex items-center justify-center shadow-md`}>
                                          <section.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <h5 className="text-base font-semibold text-gray-800">{section.title}</h5>
                                            {section.isCustom && (
                                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                                Custom
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center space-x-1">
                                              <DocumentDuplicateIcon className="w-3 h-3" />
                                              <span>{section.documents.length} documents</span>
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handleUploadClick(section, staff)}
                                          className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all text-sm"
                                        >
                                          <CloudArrowUpIcon className="w-4 h-4 text-gray-600" />
                                          <span className="text-xs font-medium text-gray-700">Upload</span>
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => toggleSectionExpand(section.id, staff.id)}
                                          className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                                        >
                                          {section.expanded ? (
                                            <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                                          ) : (
                                            <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                                          )}
                                        </motion.button>
                                      </div>
                                    </div>

                                    {/* Documents List */}
                                    <AnimatePresence>
                                      {section.expanded && section.documents.length > 0 && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="space-y-2 mt-3"
                                        >
                                          {section.documents.map((document) => (
                                            <motion.div
                                              key={document.id}
                                              whileHover={{ scale: 1.01 }}
                                              className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                  <div className="flex items-center space-x-2">
                                                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-800 text-sm">{document.name}</span>
                                                  </div>
                                                  <p className="text-xs text-gray-600 mt-1">{document.description}</p>
                                                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                                    <span className="flex items-center space-x-1">
                                                      <CalendarIcon className="w-3 h-3" />
                                                      <span>{new Date(document.uploadDate).toLocaleDateString()}</span>
                                                    </span>
                                                    <span className="flex items-center space-x-1">
                                                      <UserIcon className="w-3 h-3" />
                                                      <span>{document.uploadedBy}</span>
                                                    </span>
                                                    <span>{document.size}</span>
                                                    {document.expireDate && (
                                                      <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                                        new Date(document.expireDate) < new Date() 
                                                          ? 'bg-red-100 text-red-800' 
                                                          : new Date(document.expireDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-green-100 text-green-800'
                                                      }`}>
                                                        <ClockIcon className="w-3 h-3" />
                                                        <span>
                                                          {new Date(document.expireDate) < new Date() 
                                                            ? 'EXPIRED' 
                                                            : new Date(document.expireDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                                              ? 'EXPIRES SOON'
                                                              : `Expires ${new Date(document.expireDate).toLocaleDateString()}`
                                                          }
                                                        </span>
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-1">
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleViewDocument(document, section, staff)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Document"
                                                  >
                                                    <EyeIcon className="w-4 h-4" />
                                                  </motion.button>
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleEditDocument(document, section, staff)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Edit Document"
                                                  >
                                                    <PencilIcon className="w-4 h-4" />
                                                  </motion.button>
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleReplaceClick(document, section, staff)}
                                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Replace Document"
                                                  >
                                                    <ArrowPathIcon className="w-4 h-4" />
                                                  </motion.button>
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDeleteClick(document, section, staff)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Document"
                                                  >
                                                    <TrashIcon className="w-4 h-4" />
                                                  </motion.button>
                                                </div>
                                              </div>
                                            </motion.div>
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* Empty State */}
                                    {section.expanded && section.documents.length === 0 && (
                                      <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-4"
                                      >
                                        <DocumentTextIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No documents uploaded yet</p>
                                        <p className="text-xs text-gray-400 mt-1">Click "Upload" to add documents</p>
                                      </motion.div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            )}
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {staffMembers.reduce((sum, staff) => sum + getTotalDocuments(staff), 0)} Total Documents
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <UsersIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {staffMembers.length} Staff Members
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FolderPlusIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {staffMembers.reduce((sum, staff) => sum + staff.sections.length, 0)} Total Sections
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Empty State for filtered results */}
        {filteredAndSortedStaff.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("all");
              }}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Clear Filters
            </motion.button>
          </motion.div>
        )}
        </>
        )}
      </div>

      {/* All modals from ComplianceCulture will be added here */}
      {/* Upload Modal, View Modal, Edit Modal, Replace Modal, Delete Modal, Add Section Modal, Section Settings Modal */}
      {/* For brevity, I'll add the key modals */}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseUploadModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              {/* Upload overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <ArrowPathIcon className="w-8 h-8 text-green-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Uploading document...</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Upload Document</h3>
                <button
                  onClick={handleCloseUploadModal}
                  disabled={isUploading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {selectedStaff && selectedSection && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Staff:</strong> {selectedStaff.name}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Section:</strong> {selectedSection.title}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Description *
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    rows="3"
                    placeholder="Enter document description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expire Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={uploadData.expireDate}
                    onChange={(e) => setUploadData({ ...uploadData, expireDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set when this document expires (optional)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpeg,.jpg,.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG (MAX. 50MB)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseUploadModal}
                  disabled={isUploading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadData.file || !uploadData.description || isUploading}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Section Modal */}
      <AnimatePresence>
        {showAddSectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddSectionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Add New Section</h3>
                <button
                  onClick={() => setShowAddSectionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {selectedStaff && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Adding section for:</strong> {selectedStaff.name}
                  </p>
                  <p className="text-xs text-green-600">{selectedStaff.role}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter section title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Description
                  </label>
                  <textarea
                    value={newSection.description}
                    onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    rows="3"
                    placeholder="Enter section description..."
                  />
                </div>

              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSection}
                  disabled={!newSection.title}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Section
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Document Modal */}
      <AnimatePresence>
        {showViewModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <EyeIcon className="w-6 h-6 mr-2 text-blue-600" />
                  View Document
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedDocument.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedDocument.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedDocument.size}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded By</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedDocument.uploadedBy}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {new Date(selectedDocument.uploadDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expire Date</label>
                    <p className={`bg-gray-50 p-3 rounded-lg ${selectedDocument.expireDate 
                      ? new Date(selectedDocument.expireDate) < new Date() 
                        ? 'text-red-600 font-semibold' 
                        : new Date(selectedDocument.expireDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          ? 'text-orange-600 font-semibold'
                          : 'text-gray-900'
                      : 'text-gray-500'
                    }`}>
                      {selectedDocument.expireDate 
                        ? new Date(selectedDocument.expireDate).toLocaleDateString() +
                          (new Date(selectedDocument.expireDate) < new Date() ? ' (EXPIRED)' : 
                           new Date(selectedDocument.expireDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? ' (EXPIRES SOON)' : '')
                        : 'No expiry date'
                      }
                    </p>
                  </div>
                </div>

                {selectedDocument.fileUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Preview</label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <a 
                        href={selectedDocument.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <DocumentTextIcon className="w-5 h-5 mr-2" />
                        Open Document
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Document Modal */}
      <AnimatePresence>
        {showEditModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <PencilIcon className="w-6 h-6 mr-2 text-green-600" />
                  Edit Document
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const description = formData.get('description');
                  const expireDate = formData.get('expireDate');
                  handleUpdateDocument(description, expireDate);
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                    <p className="text-gray-900 bg-gray-100 p-3 rounded-lg">{selectedDocument.name}</p>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      defaultValue={selectedDocument.description}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      rows="4"
                      placeholder="Enter document description..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="expireDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Expire Date (Optional)
                    </label>
                    <input
                      id="expireDate"
                      name="expireDate"
                      type="date"
                      defaultValue={selectedDocument.expireDate ? new Date(selectedDocument.expireDate).toISOString().split('T')[0] : ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to remove expiry date
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isUploading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Update Document
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Document Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-red-600" />
                  Delete Document
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete this document? This action cannot be undone.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="font-medium text-gray-900">{selectedDocument.name}</p>
                  <p className="text-gray-600 text-sm">{selectedDocument.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE here..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  disabled={deleteConfirmText !== "DELETE" || isUploading}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete Document
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replace Document Modal */}
      <AnimatePresence>
        {showReplaceModal && selectedDocument && (
          <motion.di   v
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <DocumentDuplicateIcon className="w-6 h-6 mr-2 text-purple-600" />
                  Replace Document
                </h3>
                <button
                  onClick={() => {
                    setShowReplaceModal(false);
                    setReplaceFile(null);
                    setReplaceExpireDate("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Current Document:</h4>
                  <p className="text-gray-700">{selectedDocument.name}</p>
                  <p className="text-gray-600 text-sm">{selectedDocument.description}</p>
                  <p className="text-gray-500 text-sm mt-1">Size: {selectedDocument.size}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New File *
                  </label> 
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {replaceFile ? (
                          <div className="text-center">
                            <DocumentTextIcon className="w-8 h-8 mb-2 text-green-600 mx-auto" />
                            <p className="text-sm text-gray-700 font-medium">{replaceFile.name}</p>
                            <p className="text-xs text-gray-500">{(replaceFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <CloudArrowUpIcon className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG (MAX. 50MB)</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpeg,.jpg,.png"
                        onChange={(e) => setReplaceFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Expire Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={replaceExpireDate}
                    onChange={(e) => setReplaceExpireDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to remove expiry date, or update the expiry date for the new file
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReplaceModal(false);
                    setReplaceFile(null);
                    setReplaceExpireDate("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplaceDocument}
                  disabled={!replaceFile || isUploading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Replacing...
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                      Replace Document
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.di>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplianceStaff;