import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import {
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  CheckIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  SparklesIcon,
  ClockIcon,
  TrashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";

const documentTypeLabels = {
  passport: "Passport",
  qid: "QID",
  id_document: "ID Document",
  cr_extract: "CR Extract",
  company_memo: "Company Memo",
  engagement_letter: "Engagement Letter",
  other_document: "Other Document",
  kyc_document: "KYC Document",
  bra_document: "BRA Document",
  ubo_document: "UBO Document",
  cdd_document: "CDD Document",
  approval_document: "Approval Document",
  rejection_document: "Rejection Document",
  resubmission_document: "Resubmission Document",
};

const sourceTypeLabels = {
  job: "Job",
  company: "Company",
  engagement_letter: "Engagement Letter",
  director: "Director",
  shareholder: "Shareholder",
  secretary: "Secretary",
  sef: "SEF",
  kyc: "KYC",
  bra: "BRA",
  ubo: "UBO",
  cdd: "CDD",
};

const sourceTypeStyles = {
  job: { bg: "from-blue-500 to-blue-600", light: "bg-blue-50 text-blue-700 border-blue-200", icon: "text-blue-500" },
  company: { bg: "from-purple-500 to-purple-600", light: "bg-purple-50 text-purple-700 border-purple-200", icon: "text-purple-500" },
  engagement_letter: { bg: "from-violet-500 to-fuchsia-600", light: "bg-violet-50 text-violet-700 border-violet-200", icon: "text-violet-500" },
  director: { bg: "from-emerald-500 to-emerald-600", light: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "text-emerald-500" },
  shareholder: { bg: "from-amber-500 to-amber-600", light: "bg-amber-50 text-amber-700 border-amber-200", icon: "text-amber-500" },
  secretary: { bg: "from-pink-500 to-pink-600", light: "bg-pink-50 text-pink-700 border-pink-200", icon: "text-pink-500" },
  sef: { bg: "from-indigo-500 to-indigo-600", light: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "text-indigo-500" },
  kyc: { bg: "from-cyan-500 to-cyan-600", light: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: "text-cyan-500" },
  bra: { bg: "from-orange-500 to-orange-600", light: "bg-orange-50 text-orange-700 border-orange-200", icon: "text-orange-500" },
  ubo: { bg: "from-teal-500 to-teal-600", light: "bg-teal-50 text-teal-700 border-teal-200", icon: "text-teal-500" },
  cdd: { bg: "from-rose-500 to-rose-600", light: "bg-rose-50 text-rose-700 border-rose-200", icon: "text-rose-500" },
};

const categoryGroups = [
  {
    id: "company",
    name: "Company",
    icon: BuildingOfficeIcon,
    gradient: "from-purple-500 to-indigo-500",
    types: ["company"],
  },
  {
    id: "engagement",
    name: "Engagement Letter",
    icon: DocumentTextIcon,
    gradient: "from-violet-500 to-fuchsia-500",
    types: ["engagement_letter"],
  },
  {
    id: "person",
    name: "Person",
    icon: UserGroupIcon,
    gradient: "from-emerald-500 to-teal-500",
    types: ["director", "shareholder", "secretary", "sef"],
  },
  {
    id: "compliance",
    name: "KYC/BRA",
    icon: ShieldCheckIcon,
    gradient: "from-cyan-500 to-blue-500",
    types: ["kyc", "bra"],
  },
  {
    id: "ubo_cdd",
    name: "UBO/CDD",
    icon: ClipboardDocumentListIcon,
    gradient: "from-orange-500 to-red-500",
    types: ["ubo", "cdd"],
  },
  {
    id: "other",
    name: "Other",
    icon: FolderIcon,
    gradient: "from-gray-500 to-slate-500",
    types: ["job"],
  },
];

function Library() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role?.name === "admin";
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSourceTypes, setSelectedSourceTypes] = useState([]);
  const [selectedDocTypes, setSelectedDocTypes] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(true);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
    fetchStats();
    const hasSeenWelcome = localStorage.getItem("libraryWelcomeSeen");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  useEffect(() => {
    fetchArchives();
  }, [pagination.page, selectedSourceTypes, selectedDocTypes, selectedClient, dateRange]);

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get("/clients/all?limit=1000");
      setClients(response.data?.clients || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get("/archives/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);

      if (searchQuery) params.append("search", searchQuery);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      if (selectedClient) params.append("clientId", selectedClient);

      const response = await axiosInstance.get(`/archives?${params.toString()}`);
      let archivesData = response.data.data || [];

      if (selectedSourceTypes.length > 0) {
        archivesData = archivesData.filter(a => selectedSourceTypes.includes(a.sourceType));
      }

      if (selectedDocTypes.length > 0) {
        archivesData = archivesData.filter(a => selectedDocTypes.includes(a.documentType));
      }

      setArchives(archivesData);
      setPagination(prev => ({
        ...prev,
        total: archivesData.length,
        totalPages: Math.ceil(archivesData.length / prev.limit) || 1,
      }));
    } catch (error) {
      console.error("Error fetching archives:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchArchives();
  };

  const toggleSourceType = (type) => {
    setSelectedSourceTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleDocType = (type) => {
    setSelectedDocTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleCategoryGroup = (group) => {
    const allSelected = group.types.every(t => selectedSourceTypes.includes(t));
    if (allSelected) {
      setSelectedSourceTypes(prev => prev.filter(t => !group.types.includes(t)));
    } else {
      setSelectedSourceTypes(prev => [...new Set([...prev, ...group.types])]);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSourceTypes([]);
    setSelectedDocTypes([]);
    setSelectedClient("");
    setDateRange({ start: "", end: "" });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openDocument = (url) => {
    window.open(url, "_blank");
  };

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("libraryWelcomeSeen", "true");
  };

  const handleDeleteArchive = async (archiveId) => {
    try {
      await axiosInstance.delete(`/archives/${archiveId}`);
      setArchives(prev => prev.filter(a => a._id !== archiveId));
      setDeleteConfirm(null);
      fetchStats();
    } catch (error) {
      console.error("Error deleting archive:", error);
      alert(error.response?.data?.message || "Failed to delete archive");
    }
  };

  const hasActiveFilters = selectedSourceTypes.length > 0 || selectedDocTypes.length > 0 || selectedClient || dateRange.start || dateRange.end || searchQuery;

  const getFileExtension = (url) => {
    if (!url) return 'file';
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    return ext || 'file';
  };

  const getFileIcon = (url) => {
    const ext = getFileExtension(url);
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    return '📎';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/mode-selection")}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl">
                  <ArchiveBoxIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Document Library
                  </h1>
                  <p className="text-indigo-200 text-sm mt-0.5 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1.5" />
                    Archived documents retained for 10 years
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {stats && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden sm:flex items-center px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20"
                >
                  <SparklesIcon className="h-5 w-5 text-yellow-300 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.totalCount}</span>
                  <span className="text-indigo-200 ml-2 text-sm">documents</span>
                </motion.div>
              )}
              <button
                onClick={() => setShowWelcomeModal(true)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 backdrop-blur-sm group"
                title="How it works"
              >
                <InformationCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: "This Month", value: stats.thisMonth || 0, icon: CalendarIcon },
                { label: "This Week", value: stats.thisWeek || 0, icon: ClockIcon },
                { label: "Categories", value: Object.keys(stats.bySourceType || {}).length, icon: FolderIcon },
                { label: "Clients", value: Object.keys(stats.byClient || {}).length, icon: UserGroupIcon },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                >
                  <div className="flex items-center space-x-2">
                    <stat.icon className="h-4 w-4 text-indigo-200" />
                    <span className="text-xs text-indigo-200">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and View Toggle Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents by name, title, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </form>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  showFilters
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs">
                    {selectedSourceTypes.length + selectedDocTypes.length + (selectedClient ? 1 : 0)}
                  </span>
                )}
              </button>
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list" ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-72 flex-shrink-0"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <FunnelIcon className="h-4 w-4 mr-2 text-indigo-600" />
                      Filters
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Client Filter */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Client
                    </label>
                    <select
                      value={selectedClient}
                      onChange={(e) => {
                        setSelectedClient(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">All Clients</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.clientName || client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Groups */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <div className="space-y-2">
                      {categoryGroups.map((group) => {
                        const Icon = group.icon;
                        const allSelected = group.types.every(t => selectedSourceTypes.includes(t));
                        const someSelected = group.types.some(t => selectedSourceTypes.includes(t));
                        return (
                          <button
                            key={group.id}
                            onClick={() => toggleCategoryGroup(group)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                              allSelected
                                ? `bg-gradient-to-r ${group.gradient} text-white shadow-md`
                                : someSelected
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center">
                              <Icon className={`h-4 w-4 mr-2.5 ${allSelected ? 'text-white' : ''}`} />
                              <span className="font-medium">{group.name}</span>
                            </div>
                            {allSelected && <CheckIcon className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Source Type */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Source Type
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {Object.entries(sourceTypeLabels).map(([value, label]) => (
                        <label
                          key={value}
                          className={`flex items-center px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            selectedSourceTypes.includes(value)
                              ? `${sourceTypeStyles[value]?.light} border`
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSourceTypes.includes(value)}
                            onChange={() => toggleSourceType(value)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-2.5 text-sm font-medium">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Document Type */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Document Type
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {Object.entries(documentTypeLabels).map(([value, label]) => (
                        <label
                          key={value}
                          className={`flex items-center px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            selectedDocTypes.includes(value)
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocTypes.includes(value)}
                            onChange={() => toggleDocType(value)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-2.5 text-sm font-medium">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Date Range
                    </label>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => {
                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                          }}
                          className="w-full px-3 py-2.5 text-sm bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => {
                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                          }}
                          className="w-full px-3 py-2.5 text-sm bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Active Filters Pills */}
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex flex-wrap gap-2"
              >
                {selectedSourceTypes.map(type => (
                  <span
                    key={type}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${sourceTypeStyles[type]?.light} border shadow-sm`}
                  >
                    {sourceTypeLabels[type]}
                    <button onClick={() => toggleSourceType(type)} className="ml-2 hover:opacity-70">
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                {selectedDocTypes.map(type => (
                  <span
                    key={type}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm"
                  >
                    {documentTypeLabels[type]}
                    <button onClick={() => toggleDocType(type)} className="ml-2 hover:opacity-70">
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                {selectedClient && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                    <BuildingOfficeIcon className="h-3.5 w-3.5 mr-1.5" />
                    {clients.find(c => c._id === selectedClient)?.clientName || 'Client'}
                    <button onClick={() => setSelectedClient('')} className="ml-2 hover:opacity-70">
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </motion.div>
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{archives.length}</span> documents
              </p>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl p-5 animate-pulse border border-gray-100">
                    <div className="flex items-start space-x-3">
                      <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : archives.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-gray-100 p-12 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ArchiveBoxIcon className="h-10 w-10 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  {hasActiveFilters
                    ? "Try adjusting your filters to find what you're looking for"
                    : "Documents will appear here when they are replaced or archived"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archives.map((archive, index) => (
                  <motion.div
                    key={archive._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${sourceTypeStyles[archive.sourceType]?.bg || 'from-gray-500 to-gray-600'} shadow-lg`}>
                          <span className="text-xl">{getFileIcon(archive.fileUrl)}</span>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDocument(archive.fileUrl)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <a
                            href={archive.fileUrl}
                            download
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </a>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteConfirm(archive._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                        {archive.title || archive.fileName || "Untitled Document"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${sourceTypeStyles[archive.sourceType]?.light || "bg-gray-100 text-gray-700"}`}>
                          {sourceTypeLabels[archive.sourceType] || archive.sourceType}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {documentTypeLabels[archive.documentType] || archive.documentType}
                        </span>
                      </div>

                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        {archive.clientId && (
                          <span className="flex items-center truncate">
                            <BuildingOfficeIcon className="h-3.5 w-3.5 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{archive.clientId.clientName || archive.clientId.name}</span>
                          </span>
                        )}
                        <span className="flex items-center flex-shrink-0">
                          <CalendarIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          {new Date(archive.archivedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        {getFileExtension(archive.fileUrl)}
                      </span>
                      {archive.personName && (
                        <span className="flex items-center text-xs text-gray-500">
                          <UserIcon className="h-3 w-3 mr-1" />
                          {archive.personName}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {archives.map((archive, index) => (
                    <motion.div
                      key={archive._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${sourceTypeStyles[archive.sourceType]?.bg || 'from-gray-500 to-gray-600'} shadow-md flex-shrink-0`}>
                          <span className="text-lg">{getFileIcon(archive.fileUrl)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                              {archive.title || archive.fileName || "Untitled Document"}
                            </h3>
                            <div className="flex items-center space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openDocument(archive.fileUrl)}
                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <a
                                href={archive.fileUrl}
                                download
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </a>
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteConfirm(archive._id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sourceTypeStyles[archive.sourceType]?.light || "bg-gray-100 text-gray-700"}`}>
                              {sourceTypeLabels[archive.sourceType] || archive.sourceType}
                            </span>
                            <span className="text-xs text-gray-500">
                              {documentTypeLabels[archive.documentType] || archive.documentType}
                            </span>
                            {archive.clientId && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500 flex items-center">
                                  <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                                  {archive.clientId.clientName || archive.clientId.name}
                                </span>
                              </>
                            )}
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(archive.archivedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {archives.length > 0 && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page <span className="font-medium text-gray-900">{pagination.page}</span> of{" "}
                  <span className="font-medium text-gray-900">{pagination.totalPages}</span>
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Archive Document
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                Are you sure you want to permanently delete this archived document? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteArchive(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseWelcome}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-8">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-30" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-30" />
                <div className="relative flex items-center justify-center">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl"
                  >
                    <ArchiveBoxIcon className="h-12 w-12 text-white" />
                  </motion.div>
                </div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative text-2xl font-bold text-white text-center mt-4"
                >
                  Welcome to Document Library
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative text-indigo-200 text-center text-sm mt-2"
                >
                  Your secure document archive system
                </motion.p>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <ArrowPathIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Automatic Archiving</h3>
                      <p className="text-gray-600 text-xs mt-1">
                        When you replace any document in the system, the old version is automatically saved here for safekeeping.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start space-x-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100"
                  >
                    <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                      <ClockIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">10 Year Retention</h3>
                      <p className="text-gray-600 text-xs mt-1">
                        All archived documents are securely stored and retained for 10 years for compliance and audit purposes.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <FunnelIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Easy Search & Filter</h3>
                      <p className="text-gray-600 text-xs mt-1">
                        Find any archived document quickly using filters by client, category, document type, or date range.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-start space-x-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100"
                  >
                    <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                      <EyeIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">View & Download</h3>
                      <p className="text-gray-600 text-xs mt-1">
                        Access any archived document anytime - view it directly or download a copy for your records.
                      </p>
                    </div>
                  </motion.div>
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={handleCloseWelcome}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Got it, let's explore!</span>
                </motion.button>

                <p className="text-center text-xs text-gray-400 mt-4">
                  This message won't appear again
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Library;
