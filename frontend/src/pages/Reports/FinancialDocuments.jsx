// pages/Reports/FinancialDocuments.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  FolderIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  TableCellsIcon
} from "@heroicons/react/24/outline";
import { fileUploadInstance } from "../../utils/axios";
import axiosInstance from "../../utils/axios";

const FinancialDocuments = ({ documentType, title, description }) => {
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditFileModal, setShowEditFileModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    selectedClient: "",
    selectedYear: "",
    selectedFileType: "",
    searchQuery: "",
    dateRange: {
      from: "",
      to: ""
    },
    sortBy: "updatedAt",
    sortOrder: "desc"
  });

  const [uploadData, setUploadData] = useState({
    year: new Date().getFullYear(),
    description: "",
    clientId: "",
    files: []
  });

  const [fileEditData, setFileEditData] = useState({
    fileName: "",
    newFile: null
  });

  // Available file types for filtering
  const fileTypes = [
    { value: "pdf", label: "PDF Documents", icon: "📄" },
    { value: "word", label: "Word Documents", icon: "📝" },
    { value: "excel", label: "Excel Sheets", icon: "📊" },
    { value: "image", label: "Images", icon: "🖼️" }
  ];

  // Sort options
  const sortOptions = [
    { value: "updatedAt", label: "Last Updated" },
    { value: "year", label: "Year" },
    { value: "companyName", label: "Company Name" },
    { value: "createdAt", label: "Date Created" }
  ];

  // Fetch clients and documents on component mount
  useEffect(() => {
    fetchClients();
    fetchDocuments();
  }, [documentType]);

  // Fetch documents when filters change
  useEffect(() => {
    fetchDocuments();
  }, [filters.selectedClient, documentType]);

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get("/financial-documents/clients");
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to fetch companies");
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = filters.selectedClient ? `?clientId=${filters.selectedClient}` : "";
      const response = await axiosInstance.get(`/financial-documents/${documentType}${params}`);
      if (response.data.success) {
        const validDocuments = response.data.data.filter(doc => {
          if (!doc.clientId) {
            console.warn("Document missing clientId:", doc);
            return false;
          }
          return true;
        });
        setDocuments(validDocuments);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Apply search filter
    if (filters.searchQuery) {
      filtered = filtered.filter(doc => 
        doc.companyName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        doc.gmail.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Apply year filter
    if (filters.selectedYear) {
      filtered = filtered.filter(doc => doc.year.toString() === filters.selectedYear);
    }

    // Apply file type filter
    if (filters.selectedFileType) {
      filtered = filtered.filter(doc => 
        doc.documents.some(file => {
          if (filters.selectedFileType === "pdf") return file.fileType?.includes('pdf');
          if (filters.selectedFileType === "word") return file.fileType?.includes('word') || file.fileType?.includes('document');
          if (filters.selectedFileType === "excel") return file.fileType?.includes('excel') || file.fileType?.includes('sheet');
          if (filters.selectedFileType === "image") return file.fileType?.includes('image');
          return false;
        })
      );
    }

    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.updatedAt);
        const fromDate = filters.dateRange.from ? new Date(filters.dateRange.from) : null;
        const toDate = filters.dateRange.to ? new Date(filters.dateRange.to) : null;
        
        if (fromDate && toDate) {
          return docDate >= fromDate && docDate <= toDate;
        } else if (fromDate) {
          return docDate >= fromDate;
        } else if (toDate) {
          return docDate <= toDate;
        }
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case "year":
          aValue = a.year;
          bValue = b.year;
          break;
        case "companyName":
          aValue = a.companyName.toLowerCase();
          bValue = b.companyName.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [documents, filters]);

  // Get unique years from documents
  const availableYears = useMemo(() => {
    const years = [...new Set(documents.map(doc => doc.year))].sort((a, b) => b - a);
    return years;
  }, [documents]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalDocuments = documents.length;
    const totalFiles = documents.reduce((sum, doc) => sum + doc.documents.length, 0);
    const totalCompanies = new Set(documents.map(doc => doc.clientId?._id || doc.clientId)).size;
    const recentDocuments = documents.filter(doc => {
      const daysDiff = (new Date() - new Date(doc.updatedAt)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return {
      totalDocuments,
      totalFiles,
      totalCompanies,
      recentDocuments
    };
  }, [documents]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFileValidation(files);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileValidation(files);
  };

  const handleFileValidation = (files) => {
    if (files.length > 3) {
      setError("Maximum 3 files allowed per year");
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError("Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, and PNG files are allowed");
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError("Each file must be less than 50MB");
      return;
    }

    setUploadData(prev => ({ ...prev, files }));
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.year || !uploadData.description || !uploadData.clientId || uploadData.files.length === 0) {
      setError("Please fill all fields, select a company, and choose at least one file");
      return;
    }

    const existingDoc = documents.find(doc => {
      const docClientId = doc.clientId?._id || doc.clientId;
      return doc.year === parseInt(uploadData.year) && docClientId === uploadData.clientId;
    });
    
    if (existingDoc && existingDoc.documents && existingDoc.documents.length + uploadData.files.length > 3) {
      setError(`Cannot add ${uploadData.files.length} files. Year ${uploadData.year} for this company already has ${existingDoc.documents.length} document(s). Maximum 3 allowed.`);
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("year", uploadData.year);
      formData.append("description", uploadData.description);
      formData.append("clientId", uploadData.clientId);
      
      uploadData.files.forEach((file) => {
        formData.append("documents", file);
      });

      const response = await fileUploadInstance.post(
        `/financial-documents/${documentType}`,
        formData
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setShowUploadModal(false);
        setUploadData({
          year: new Date().getFullYear(),
          description: "",
          clientId: "",
          files: []
        });
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.response?.data?.message || "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  const handleEditDescription = async (e) => {
    e.preventDefault();
    
    if (!editingDocument || !editingDocument.description.trim()) {
      setError("Description is required");
      return;
    }

    try {
      const clientId = editingDocument.clientId?._id || editingDocument.clientId;
      const response = await axiosInstance.put(
        `/financial-documents/${documentType}/${editingDocument.year}`,
        { 
          description: editingDocument.description,
          clientId: clientId
        }
      );

      if (response.data.success) {
        setSuccess("Description updated successfully");
        setShowEditModal(false);
        setEditingDocument(null);
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || "Failed to update description");
    }
  };

  const handleEditFile = async (e) => {
    e.preventDefault();
    
    if (!editingFile || (!fileEditData.fileName.trim() && !fileEditData.newFile)) {
      setError("Please provide a filename or select a new file");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("clientId", editingFile.clientId);
      
      if (fileEditData.fileName.trim()) {
        formData.append("fileName", fileEditData.fileName.trim());
      }
      
      if (fileEditData.newFile) {
        formData.append("document", fileEditData.newFile);
      }

      const response = await fileUploadInstance.put(
        `/financial-documents/${documentType}/${editingFile.year}/${editingFile.fileId}`,
        formData
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setShowEditFileModal(false);
        setEditingFile(null);
        setFileEditData({ fileName: "", newFile: null });
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Edit file error:", error);
      setError(error.response?.data?.message || "Failed to update document file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (year, fileId, fileName, clientId) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const response = await axiosInstance.delete(
        `/financial-documents/${documentType}/${year}/${fileId}?clientId=${clientId}`
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError(error.response?.data?.message || "Failed to delete file");
    }
  };

  const handleDeleteYear = async (year, clientId, companyName) => {
    if (!window.confirm(`Are you sure you want to delete all documents for ${companyName} - ${year}?`)) {
      return;
    }

    try {
      const response = await axiosInstance.delete(
        `/financial-documents/${documentType}/${year}?clientId=${clientId}`
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError(error.response?.data?.message || "Failed to delete documents");
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return '📊';
    if (fileType?.includes('image')) return '🖼️';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  const clearFilters = () => {
    setFilters({
      selectedClient: "",
      selectedYear: "",
      selectedFileType: "",
      searchQuery: "",
      dateRange: { from: "", to: "" },
      sortBy: "updatedAt",
      sortOrder: "desc"
    });
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-700 font-medium">Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                  <DocumentTextIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                  <p className="text-gray-600 text-lg">{description}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="font-medium">Add Documents</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalDocuments}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <DocumentIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalFiles}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FolderIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalCompanies}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent (7 days)</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.recentDocuments}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 shadow-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 shadow-lg">
            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
            <span className="text-green-700 font-medium">{success}</span>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  placeholder="Search companies, descriptions..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <select
                value={filters.selectedClient}
                onChange={(e) => setFilters(prev => ({ ...prev, selectedClient: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Companies</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={filters.selectedYear}
                onChange={(e) => setFilters(prev => ({ ...prev, selectedYear: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <select
                value={filters.selectedFileType}
                onChange={(e) => setFilters(prev => ({ ...prev, selectedFileType: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                {fileTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" 
                  }))}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title={`Sort ${filters.sortOrder === "asc" ? "Descending" : "Ascending"}`}
                >
                  {filters.sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateRange.from}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, from: e.target.value }
                }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateRange.to}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, to: e.target.value }
                }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <DocumentIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-6">
                {documents.length === 0 
                  ? `Get started by uploading your first ${title.toLowerCase()}.`
                  : "Try adjusting your filters to find the documents you're looking for."
                }
              </p>
              {documents.length === 0 && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Upload Documents
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredDocuments.length}</span> of{" "}
                  <span className="font-medium">{documents.length}</span> documents
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year & Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {doc.companyName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {doc.companyName}
                              </div>
                              <div className="text-sm text-gray-500">{doc.gmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {doc.year}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 max-w-xs">{doc.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {doc.documents.map((file, index) => (
                              <div key={file._id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                      {file.fileName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.fileSize)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="View document"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </a>
                                  <button
                                    onClick={() => {
                                      const docClientId = doc.clientId?._id || doc.clientId;
                                      setEditingFile({
                                        fileId: file._id,
                                        year: doc.year,
                                        fileName: file.fileName,
                                        clientId: docClientId
                                      });
                                      setFileEditData({
                                        fileName: file.fileName,
                                        newFile: null
                                      });
                                      setShowEditFileModal(true);
                                    }}
                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit document"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const docClientId = doc.clientId?._id || doc.clientId;
                                      handleDeleteFile(
                                        doc.year, 
                                        file._id, 
                                        file.fileName, 
                                        docClientId
                                      );
                                    }}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete document"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(doc.updatedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingDocument({ ...doc });
                                setShowEditModal(true);
                              }}
                              className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit description"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const docClientId = doc.clientId?._id || doc.clientId;
                                handleDeleteYear(
                                  doc.year, 
                                  docClientId, 
                                  doc.companyName
                                );
                              }}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete all documents for this year"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                      <CloudArrowUpIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Upload {title}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadData({
                        year: new Date().getFullYear(),
                        description: "",
                        clientId: "",
                        files: []
                      });
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company *
                      </label>
                      <select
                        value={uploadData.clientId}
                        onChange={(e) => setUploadData(prev => ({ ...prev, clientId: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Company</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.name} ({client.gmail})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year *
                      </label>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 10}
                        value={uploadData.year}
                        onChange={(e) => setUploadData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Describe the documents..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documents (Max 3 files) *
                    </label>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        dragActive
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={uploadData.files.length === 0}
                      />
                      <div className="space-y-3">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <ArrowUpTrayIcon className="h-8 w-8 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            Drop files here or click to browse
                          </p>
                          <p className="text-sm text-gray-500">
                            PDF, DOC, DOCX, XLS, XLSX, JPG, PNG files only. Max 50MB each.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {uploadData.files.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Selected files:</p>
                      <div className="space-y-2">
                        {uploadData.files.map((file, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                            <span className="text-2xl">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">({formatFileSize(file.size)})</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadData({
                          year: new Date().getFullYear(),
                          description: "",
                          clientId: "",
                          files: []
                        });
                      }}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-4 w-4" />
                          <span>Upload Documents</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Description Modal */}
        {showEditModal && editingDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Edit Description - {editingDocument.year}
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleEditDescription} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingDocument.description}
                      onChange={(e) => setEditingDocument(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Update Description
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit File Modal */}
        {showEditFileModal && editingFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Edit Document
                  </h3>
                  <button
                    onClick={() => setShowEditFileModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleEditFile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={fileEditData.fileName}
                      onChange={(e) => setFileEditData(prev => ({ ...prev, fileName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter new filename..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Replace File (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const allowedTypes = [
                              'application/pdf',
                              'application/msword',
                              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                              'application/vnd.ms-excel',
                              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                              'image/jpeg',
                              'image/png',
                              'image/jpg'
                            ];

                            if (!allowedTypes.includes(file.type)) {
                              setError("Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, and PNG files are allowed");
                              e.target.value = '';
                              return;
                            }

                            if (file.size > 50 * 1024 * 1024) {
                              setError("File must be less than 50MB");
                              e.target.value = '';
                              return;
                            }

                            setFileEditData(prev => ({ ...prev, newFile: file }));
                            setError("");
                          }
                        }}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Leave empty to keep current file. Max 50MB.
                      </p>
                    </div>
                  </div>

                  {fileEditData.newFile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-800 mb-2">New file selected:</p>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(fileEditData.newFile.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-blue-900">{fileEditData.newFile.name}</p>
                          <p className="text-xs text-blue-700">({formatFileSize(fileEditData.newFile.size)})</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditFileModal(false)}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <PencilIcon className="h-4 w-4" />
                          <span>Update Document</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDocuments;