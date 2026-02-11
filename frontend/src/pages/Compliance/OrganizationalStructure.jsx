import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import {
  BuildingOffice2Icon,
  ArrowLeftIcon,
  HomeIcon,
  PlusIcon,
  CloudArrowUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";
import axios from "../../utils/axios";
import toast from "react-hot-toast";

const OrganizationalStructure = () => {
  const navigate = useNavigate();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showViewDocModal, setShowViewDocModal] = useState(false);
  const [showReplaceDocModal, setShowReplaceDocModal] = useState(false);
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);

  const [selectedStructure, setSelectedStructure] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [expandedStructures, setExpandedStructures] = useState({});

  const [newStructure, setNewStructure] = useState({
    title: "",
    description: "",
    documents: [],
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);

  useEffect(() => {
    loadStructures();
  }, []);

  const loadStructures = async () => {
    try {
      setDataLoading(true);
      const response = await axios.get("/organizational-structure?limit=100");
      if (response.data.success) {
        setStructures(response.data.data);
        const expanded = {};
        response.data.data.forEach((s) => {
          expanded[s._id] = true;
        });
        setExpandedStructures(expanded);
      }
    } catch (error) {
      console.error("Error loading structures:", error);
      toast.error("Failed to load organizational structures");
    } finally {
      setDataLoading(false);
    }
  };

  const handleAddStructure = async () => {
    if (!newStructure.title) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", newStructure.title);
      formData.append("description", newStructure.description || "");

      if (newStructure.documents.length > 0) {
        newStructure.documents.forEach((file) => {
          formData.append("documents", file);
        });
      }

      const response = await axios.post("/organizational-structure", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Organizational structure created successfully");
        setStructures([response.data.data, ...structures]);
        setExpandedStructures({
          ...expandedStructures,
          [response.data.data._id]: true,
        });
        setShowAddModal(false);
        setNewStructure({ title: "", description: "", documents: [] });
      }
    } catch (error) {
      console.error("Error creating structure:", error);
      toast.error(
        "Failed to create structure: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditStructure = async () => {
    if (!selectedStructure?.title) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `/organizational-structure/${selectedStructure._id}`,
        {
          title: selectedStructure.title,
          description: selectedStructure.description,
        }
      );

      if (response.data.success) {
        toast.success("Structure updated successfully");
        setStructures(
          structures.map((s) =>
            s._id === selectedStructure._id ? response.data.data : s
          )
        );
        setShowEditModal(false);
        setSelectedStructure(null);
      }
    } catch (error) {
      console.error("Error updating structure:", error);
      toast.error("Failed to update structure");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStructure = async () => {
    if (deleteConfirmText !== "DELETE") return;

    try {
      setLoading(true);
      const response = await axios.delete(
        `/organizational-structure/${selectedStructure._id}`
      );

      if (response.data.success) {
        toast.success("Structure deleted successfully");
        setStructures(structures.filter((s) => s._id !== selectedStructure._id));
        setShowDeleteModal(false);
        setSelectedStructure(null);
        setDeleteConfirmText("");
      }
    } catch (error) {
      console.error("Error deleting structure:", error);
      toast.error("Failed to delete structure");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!uploadFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("document", uploadFile);

      const response = await axios.post(
        `/organizational-structure/${selectedStructure._id}/documents`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        toast.success("Document added successfully");
        setStructures(
          structures.map((s) =>
            s._id === selectedStructure._id ? response.data.data : s
          )
        );
        setShowUploadDocModal(false);
        setUploadFile(null);
        setSelectedStructure(null);
      }
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Failed to add document");
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceDocument = async () => {
    if (!replaceFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("document", replaceFile);

      const response = await axios.put(
        `/organizational-structure/${selectedStructure._id}/documents/${selectedDocument._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        toast.success("Document replaced successfully");
        setStructures(
          structures.map((s) =>
            s._id === selectedStructure._id ? response.data.data : s
          )
        );
        setShowReplaceDocModal(false);
        setReplaceFile(null);
        setSelectedDocument(null);
        setSelectedStructure(null);
      }
    } catch (error) {
      console.error("Error replacing document:", error);
      toast.error("Failed to replace document");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (deleteConfirmText !== "DELETE") return;

    try {
      setLoading(true);
      const response = await axios.delete(
        `/organizational-structure/${selectedStructure._id}/documents/${selectedDocument._id}`
      );

      if (response.data.success) {
        toast.success("Document deleted successfully");
        setStructures(
          structures.map((s) =>
            s._id === selectedStructure._id ? response.data.data : s
          )
        );
        setShowDeleteDocModal(false);
        setDeleteConfirmText("");
        setSelectedDocument(null);
        setSelectedStructure(null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = (doc) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank");
    } else {
      toast.error("Document file not found");
    }
  };

  const toggleExpand = (id) => {
    setExpandedStructures({
      ...expandedStructures,
      [id]: !expandedStructures[id],
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
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
                onClick={() => navigate("/compliance-selection")}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Back</span>
              </motion.button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <BuildingOffice2Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Organizational Structure
                </h1>
                <p className="text-xs text-gray-500">Document Management</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <HomeIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Dashboard
              </span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Organizational Structure Documents
            </h2>
            <p className="text-gray-600">
              Manage your organization's structural documents
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <FolderPlusIcon className="w-5 h-5" />
            <span>Add New Structure</span>
          </motion.button>
        </motion.div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : structures.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-2xl shadow-lg"
          >
            <BuildingOffice2Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Organizational Structures Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start by adding your first organizational structure document
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Structure</span>
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {structures.map((structure, index) => (
              <motion.div
                key={structure._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-white/60"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <BuildingOffice2Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">
                        {structure.title}
                      </h3>
                      {structure.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {structure.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <DocumentTextIcon className="w-4 h-4" />
                          <span>{structure.documents?.length || 0} documents</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {new Date(structure.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedStructure(structure);
                        setShowUploadDocModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                    >
                      <CloudArrowUpIcon className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Add Document
                      </span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedStructure({ ...structure });
                        setShowEditModal(true);
                      }}
                      className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                      title="Edit Structure"
                    >
                      <PencilIcon className="w-5 h-5 text-green-600" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedStructure(structure);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-all hover:bg-red-50"
                      title="Delete Structure"
                    >
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleExpand(structure._id)}
                      className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                    >
                      {expandedStructures[structure._id] ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </motion.button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedStructures[structure._id] &&
                    structure.documents?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 mt-4"
                      >
                        {structure.documents.map((doc) => (
                          <motion.div
                            key={doc._id}
                            whileHover={{ scale: 1.01 }}
                            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <DocumentTextIcon className="w-5 h-5 text-amber-500" />
                                  <span className="font-medium text-gray-800">
                                    {doc.fileName}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    <span>
                                      {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </span>
                                  </span>
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  <span className="uppercase text-amber-600 font-medium">
                                    {doc.fileType}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleOpenDocument(doc)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Document"
                                >
                                  <EyeIcon className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setSelectedStructure(structure);
                                    setSelectedDocument(doc);
                                    setShowViewDocModal(true);
                                  }}
                                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <DocumentTextIcon className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setSelectedStructure(structure);
                                    setSelectedDocument(doc);
                                    setShowReplaceDocModal(true);
                                  }}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Replace Document"
                                >
                                  <ArrowPathIcon className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setSelectedStructure(structure);
                                    setSelectedDocument(doc);
                                    setShowDeleteDocModal(true);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Document"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                </AnimatePresence>

                {expandedStructures[structure._id] &&
                  (!structure.documents || structure.documents.length === 0) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No documents uploaded yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Click "Add Document" to upload your first document
                      </p>
                    </motion.div>
                  )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Add New Organizational Structure
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newStructure.title}
                    onChange={(e) =>
                      setNewStructure({ ...newStructure, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter structure title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newStructure.description}
                    onChange={(e) =>
                      setNewStructure({
                        ...newStructure,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                    rows="3"
                    placeholder="Enter description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Documents (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setNewStructure({
                        ...newStructure,
                        documents: Array.from(e.target.files),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  {newStructure.documents.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      {newStructure.documents.length} file(s) selected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewStructure({ title: "", description: "", documents: [] });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStructure}
                  disabled={loading || !newStructure.title}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Structure"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedStructure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Structure
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={selectedStructure.title}
                    onChange={(e) =>
                      setSelectedStructure({
                        ...selectedStructure,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedStructure.description || ""}
                    onChange={(e) =>
                      setSelectedStructure({
                        ...selectedStructure,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditStructure}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && selectedStructure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Delete Structure
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>Structure to delete:</strong>
                  </p>
                  <p className="font-medium text-red-900">
                    {selectedStructure.title}
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {selectedStructure.documents?.length || 0} documents will
                    also be deleted
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type{" "}
                    <span className="font-bold text-red-600">DELETE</span> to
                    confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStructure}
                  disabled={loading || deleteConfirmText !== "DELETE"}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    deleteConfirmText === "DELETE"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Deleting..." : "Delete Structure"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadDocModal && selectedStructure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowUploadDocModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Add Document
                </h3>
                <button
                  onClick={() => setShowUploadDocModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  Adding to: <strong>{selectedStructure.title}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File *
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {uploadFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {uploadFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadDocModal(false);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDocument}
                  disabled={loading || !uploadFile}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewDocModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewDocModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Document Details
                </h3>
                <button
                  onClick={() => setShowViewDocModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">File Name</p>
                  <p className="font-medium text-gray-800">
                    {selectedDocument.fileName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">File Type</p>
                    <p className="font-medium text-gray-800 uppercase">
                      {selectedDocument.fileType}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">File Size</p>
                    <p className="font-medium text-gray-800">
                      {formatFileSize(selectedDocument.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Upload Date</p>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedDocument.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => handleOpenDocument(selectedDocument)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>Open Document</span>
                </button>
                <button
                  onClick={() => setShowViewDocModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReplaceDocModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowReplaceDocModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <ArrowPathIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Replace Document
                  </h3>
                  <p className="text-sm text-gray-500">Upload a new file</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-orange-800 mb-2">
                    <strong>Current Document:</strong>
                  </p>
                  <p className="font-medium text-orange-900">
                    {selectedDocument.fileName}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Size: {formatFileSize(selectedDocument.fileSize)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setReplaceFile(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  {replaceFile && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>New file:</strong> {replaceFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowReplaceDocModal(false);
                    setReplaceFile(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplaceDocument}
                  disabled={loading || !replaceFile}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    replaceFile && !loading
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Replacing..." : "Replace Document"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteDocModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteDocModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Delete Document
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>Document to delete:</strong>
                  </p>
                  <p className="font-medium text-red-900">
                    {selectedDocument.fileName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type{" "}
                    <span className="font-bold text-red-600">DELETE</span> to
                    confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteDocModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  disabled={loading || deleteConfirmText !== "DELETE"}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    deleteConfirmText === "DELETE"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Deleting..." : "Delete Document"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationalStructure;
