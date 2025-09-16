import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  HomeIcon,
  PlusIcon,
  CloudArrowUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
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
} from "@heroicons/react/24/outline";
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

const ComplianceCulture = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showSectionSettingsModal, setShowSectionSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteSectionConfirmText, setDeleteSectionConfirmText] = useState("");
  const [replaceFile, setReplaceFile] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [uploadData, setUploadData] = useState({
    description: "",
    file: null,
  });
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
    maxDocuments: 10,
  });

  const colorMap = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-purple-500 to-violet-600",
    orange: "from-orange-500 to-red-600",
    pink: "from-pink-500 to-rose-600",
    cyan: "from-cyan-500 to-blue-600",
    red: "from-red-500 to-pink-600",
  };

  const bgColorMap = {
    blue: "bg-blue-50",
    green: "bg-emerald-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
    pink: "bg-pink-50",
    cyan: "bg-cyan-50",
    red: "bg-red-50",
  };

  const handleUploadClick = (section) => {
    setSelectedSection(section);
    setShowUploadModal(true);
  };

  const handleFileUpload = async () => {
    if (!uploadData.file || !uploadData.description) {
      toast.error('Please select a file and enter description');
      return;
    }

    // Check if adding documents would exceed the limit
    const currentSection = sections.find(s => (s.id === selectedSection.id || s.sectionId === selectedSection.sectionId));

    if (currentSection.documents.length >= currentSection.maxDocuments) {
      toast.error(`Cannot upload. Maximum limit of ${currentSection.maxDocuments} documents has been reached.`);
      return;
    }

    try {
      setLoading(true);
      const sectionId = selectedSection.sectionId || selectedSection.id;
      console.log('DEBUG: Upload to section:', sectionId, 'Selected section:', selectedSection);

      const formData = new FormData();
      formData.append('title', uploadData.file.name);
      formData.append('description', uploadData.description);
      formData.append('documentType', getDocumentType(sectionId));
      formData.append('category', getCategoryFromSection(sectionId));
      formData.append('targetAudience', 'All Staff');
      formData.append('sectionId', sectionId);
      formData.append('file', uploadData.file);

      console.log('DEBUG: FormData sectionId:', formData.get('sectionId'));

      const response = await axios.post('/compliance-culture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newDocument = {
          id: response.data.data._id,
          name: uploadData.file.name,
          description: uploadData.description,
          uploadDate: new Date().toISOString(),
          size: (uploadData.file.size / 1024).toFixed(2) + " KB",
          uploadedBy: "Current User",
          _id: response.data.data._id,
          title: uploadData.file.name,
          createdAt: new Date().toISOString(),
          fileUrl: response.data.data.fileUrl,
          fileType: response.data.data.fileType,
          externalLink: response.data.data.externalLink
        };

        setSections(sections.map(section =>
          (section.id === selectedSection.id || section.sectionId === selectedSection.sectionId)
            ? { ...section, documents: [...section.documents, newDocument] }
            : section
        ));

        toast.success('Document uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }

    setShowUploadModal(false);
    setUploadData({ description: "", file: null });
  };

  const handleViewDocument = (document, section) => {
    setSelectedDocument(document);
    setSelectedSection(section);
    setShowViewModal(true);
  };

  const handleEditDocument = (document, section) => {
    setSelectedDocument(document);
    setSelectedSection(section);
    setShowEditModal(true);
  };

  const handleDeleteClick = (document, section) => {
    setSelectedDocument(document);
    setSelectedSection(section);
    setShowDeleteModal(true);
    setDeleteConfirmText("");
  };

  const handleDeleteDocument = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    try {
      const response = await axios.delete(`/compliance-culture/${selectedDocument._id || selectedDocument.id}`);
      
      if (response.data.success) {
        setSections(sections.map(section =>
          (section.id === selectedSection.id || section.sectionId === selectedSection.sectionId)
            ? { ...section, documents: section.documents.filter(doc => doc.id !== selectedDocument.id && doc._id !== selectedDocument._id) }
            : section
        ));
        toast.success('Document deleted successfully');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
    
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    setSelectedDocument(null);
    setSelectedSection(null);
  };

  const handleReplaceClick = (document, section) => {
    setSelectedDocument(document);
    setSelectedSection(section);
    setShowReplaceModal(true);
    setReplaceFile(null);
  };

  const handleReplaceDocument = async () => {
    if (!replaceFile) {
      toast.error('Please select a file to replace');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', replaceFile);
      
      console.log('Replacing document:', selectedDocument._id || selectedDocument.id);
      console.log('New file:', replaceFile.name);
      
      const response = await axios.put(`/compliance-culture/${selectedDocument._id || selectedDocument.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Replace response:', response.data);
      
      if (response.data.success) {
        // Update the document in state with backend response data
        const updatedDoc = response.data.data;
        
        console.log('Backend response for replace:', updatedDoc);
        console.log('Updated document title:', updatedDoc.title);
        console.log('Updated document fileName:', updatedDoc.fileName);
        
        // Use the updated title from backend response (backend updates title to filename)
        const newDocumentName = updatedDoc.title || updatedDoc.fileName || replaceFile.name;
        
        console.log('Using document name:', newDocumentName);
        
        setSections(sections.map(section =>
          (section.id === selectedSection.id || section.sectionId === selectedSection.sectionId)
            ? {
                ...section,
                documents: section.documents.map(doc =>
                  doc.id === selectedDocument.id || doc._id === selectedDocument._id
                    ? {
                        ...doc,
                        name: newDocumentName,
                        title: newDocumentName,
                        fileName: newDocumentName,
                        size: updatedDoc.fileSize || `${(replaceFile.size / (1024 * 1024)).toFixed(2)} MB`,
                        uploadDate: updatedDoc.updatedAt || new Date().toISOString(),
                        uploadedBy: updatedDoc.lastUpdatedBy?.firstName ?
                          `${updatedDoc.lastUpdatedBy.firstName} ${updatedDoc.lastUpdatedBy.lastName || ''}`.trim() :
                          "Current User",
                        fileUrl: updatedDoc.fileUrl,
                        lastUpdated: new Date().toISOString()
                      }
                    : doc
                )
              }
            : section
        ));
        
        toast.success('Document replaced successfully');
      }
    } catch (error) {
      console.error('Replace error:', error);
      toast.error('Failed to replace document: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }

    setShowReplaceModal(false);
    setReplaceFile(null);
    setSelectedDocument(null);
    setSelectedSection(null);
  };

  const handleUpdateDocument = async (updatedDescription) => {
    try {
      const response = await axios.put(`/compliance-culture/${selectedDocument._id || selectedDocument.id}`, {
        description: updatedDescription
      });
      
      if (response.data.success) {
        setSections(sections.map(section =>
          (section.id === selectedSection.id || section.sectionId === selectedSection.sectionId)
            ? {
                ...section,
                documents: section.documents.map(doc =>
                  doc.id === selectedDocument.id || doc._id === selectedDocument._id
                    ? { ...doc, description: updatedDescription }
                    : doc
                )
              }
            : section
        ));
        toast.success('Document updated successfully');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update document');
    }
    
    setShowEditModal(false);
  };

  const handleAddSection = async () => {
    if (!newSection.title) return;

    try {
      setLoading(true);
      const response = await axios.post('/section-settings', {
        title: newSection.title,
        description: newSection.description || "Custom section for compliance documents",
        maxDocuments: newSection.maxDocuments || 10
      });

      if (response.data.success) {
        // Reload all sections from backend instead of manually adding
        await loadAllSections();
        setShowAddSectionModal(false);
        setNewSection({ title: "", description: "", maxDocuments: 10 });

        toast.success(`New section "${newSection.title}" added successfully!`);
      }
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSettings = (section) => {
    setSelectedSection(section);
    setShowSectionSettingsModal(true);
  };

  const handleDeleteSectionClick = (section) => {
    if (!section.isCustom) {
      toast.error('Cannot delete default sections');
      return;
    }

    setSelectedSection(section);
    setShowDeleteSectionModal(true);
    setDeleteSectionConfirmText("");
  };

  const handleDeleteSection = async () => {
    if (deleteSectionConfirmText !== "DELETE") return;

    try {
      setLoading(true);
      const sectionId = selectedSection.sectionId || selectedSection.id;
      const response = await axios.delete(`/section-settings/${sectionId}`);

      if (response.data.success) {
        await loadAllSections();
        toast.success(`Section "${selectedSection.title}" deleted successfully!`);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }

    setShowDeleteSectionModal(false);
    setDeleteSectionConfirmText("");
    setSelectedSection(null);
  };

  const handleUpdateSectionSettings = async (newMaxDocuments) => {
    try {
      setLoading(true);
      const sectionId = selectedSection.sectionId || selectedSection.id;
      const response = await axios.put(`/section-settings/${sectionId}`, {
        maxDocuments: newMaxDocuments
      });

      if (response.data.success) {
        setSections(sections.map(section =>
          (section.sectionId || section.id) === sectionId
            ? { ...section, maxDocuments: newMaxDocuments }
            : section
        ));

        setShowSectionSettingsModal(false);
        toast.success(`Section settings updated! Maximum documents set to ${newMaxDocuments}`);
      }
    } catch (error) {
      console.error('Error updating section settings:', error);
      toast.error('Failed to update section settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleSectionExpand = (sectionId) => {
    setSections(sections.map(section =>
      (section.id === sectionId || section.sectionId === sectionId)
        ? { ...section, expanded: !section.expanded }
        : section
    ));
  };

  // Helper functions
  const getDocumentType = (sectionId) => {
    switch(sectionId) {
      case 'policy-procedure': return 'policy';
      case 'training-materials': return 'training';
      case 'review-reports': return 'handbook';
      case 'meeting-minutes': return 'procedure';
      case 'authority-notification': return 'awareness';
      default: return 'other'; // Use 'other' for custom sections
    }
  };

  const getCategoryFromSection = (sectionId) => {
    // Check if it's a custom section
    const section = sections.find(s => (s.id === sectionId || s.sectionId === sectionId));
    if (section && section.isCustom) {
      return 'Other'; // Use 'Other' category for custom sections
    }

    switch(sectionId) {
      case 'policy-procedure': return 'Policy Documents';
      case 'training-materials': return 'Training Materials';
      case 'review-reports': return 'Best Practices';
      case 'meeting-minutes': return 'Ethics & Conduct';
      case 'authority-notification': return 'Ethics & Conduct';
      default: return 'Other';
    }
  };

  // Load sections and documents from backend on component mount
  useEffect(() => {
    if (!dataLoaded) {
      const loadData = async () => {
        await loadAllSections();
        await loadDocuments();
        setDataLoaded(true);
      };
      loadData();
    }
  }, [dataLoaded]);

  const loadAllSections = async () => {
    try {
      const response = await axios.get('/section-settings');

      if (response.data.success) {
        const allSectionsFromBackend = response.data.data.map(section => ({
          id: section.sectionId,
          sectionId: section.sectionId,
          title: section.title,
          description: section.description,
          icon: DocumentTextIcon,
          color: section.color,
          documents: [],
          expanded: true,
          isCustom: section.isCustom,
          maxDocuments: section.maxDocuments,
        }));

        setSections(allSectionsFromBackend);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      toast.error('Failed to load sections');
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await axios.get('/compliance-culture?page=1&limit=100&status=active');

      if (response.data.success) {
        const documents = response.data.data;

        // Distribute documents to sections based on category
        setSections(prevSections =>
          prevSections.map(section => {
            const sectionDocs = documents.filter(doc => {
              const docCategory = doc.category;
              const docSectionId = doc.sectionId;
              const sectionId = section.sectionId || section.id;

              // If document has a specific sectionId, only show in that section
              if (docSectionId) {
                return docSectionId === sectionId;
              }

              // For documents without sectionId (legacy documents), use category matching
              // For custom sections, do NOT show legacy documents
              if (section.isCustom) {
                // Custom sections should never show legacy documents
                // They only show documents with matching sectionId (checked above)
                return false;
              }

              // For default sections, use category matching for legacy documents
              switch(sectionId) {
                case 'policy-procedure':
                  return docCategory === 'Policy Documents';
                case 'training-materials':
                  return docCategory === 'Training Materials';
                case 'review-reports':
                  return docCategory === 'Best Practices' || docCategory === 'Case Studies';
                case 'meeting-minutes':
                  return docCategory === 'Ethics & Conduct' || docCategory === 'Awareness Programs';
                case 'authority-notification':
                  return docCategory === 'Ethics & Conduct' || docCategory === 'Awareness Programs';
                default:
                  return false;
              }
            }).map(doc => ({
              id: doc._id,
              _id: doc._id,
              name: doc.title,
              title: doc.title,
              description: doc.description,
              uploadDate: doc.createdAt,
              createdAt: doc.createdAt,
              size: doc.fileSize || 'N/A',
              uploadedBy: doc.uploadedBy?.firstName ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : 'User',
              fileUrl: doc.fileUrl,
              externalLink: doc.externalLink,
              fileType: doc.fileType
            }));

            return { ...section, documents: sectionDocs };
          })
        );
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    }
  };

  const handleOpenDocument = async (document) => {
    try {
      if (document.externalLink) {
        // Open external link in new tab
        window.open(document.externalLink, '_blank');
      } else if (document.fileUrl) {
        // Open Cloudinary file in new tab
        window.open(document.fileUrl, '_blank');
      } else {
        // Fetch full document details from backend to get file URL
        const response = await axios.get(`/compliance-culture/${document._id || document.id}`);
        if (response.data.success && response.data.data.fileUrl) {
          window.open(response.data.data.fileUrl, '_blank');
        } else {
          toast.error('Document file not found');
        }
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast.error('Failed to open document');
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
                onClick={() => navigate("/compliance-selection")}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Back</span>
              </motion.button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Compliance Culture</h1>
                <p className="text-xs text-gray-500">Document Management System</p>
              </div>
            </div>

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
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Compliance Culture Documents</h2>
          <p className="text-gray-600">Manage and organize your compliance documentation</p>
        </motion.div>

        {/* Document Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.sectionId || section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${bgColorMap[section.color]} rounded-2xl p-6 shadow-lg border border-white/60`}
            >
              {/* Section Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${colorMap[section.color]} rounded-xl flex items-center justify-center shadow-lg`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
                      {section.isCustom && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        <span>{section.documents.length} / {section.maxDocuments} documents</span>
                      </span>
                      {section.documents.length >= section.maxDocuments && (
                        <span className="flex items-center space-x-1 text-orange-600">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          <span>Limit reached</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {section.isCustom && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteSectionClick(section)}
                      className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-all hover:bg-red-50"
                      title="Delete Section"
                    >
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSectionSettings(section)}
                    className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                    title="Section Settings"
                  >
                    <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUploadClick(section)}
                    disabled={section.documents.length >= section.maxDocuments}
                    className={`flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all ${
                      section.documents.length >= section.maxDocuments 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    <CloudArrowUpIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Upload</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSectionExpand(section.sectionId || section.id)}
                    className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                  >
                    {section.expanded ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-600" />
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
                    className="space-y-3 mt-4"
                  >
                    {section.documents.map((document) => (
                      <motion.div
                        key={document._id || document.id}
                        whileHover={{ scale: 1.01 }}
                        onDoubleClick={() => handleOpenDocument(document)}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        title="Double-click to open document"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                              <span className="font-medium text-gray-800">{document.name}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <CalendarIcon className="w-3 h-3" />
                                <span>{new Date(document.uploadDate).toLocaleDateString()}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <ClockIcon className="w-3 h-3" />
                                <span>{new Date(document.uploadDate).toLocaleTimeString()}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <UserIcon className="w-3 h-3" />
                                <span>{document.uploadedBy}</span>
                              </span>
                              <span>{document.size}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenDocument(document)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Open Document"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewDocument(document, section)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <DocumentTextIcon className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditDocument(document, section)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit Document"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleReplaceClick(document, section)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Replace Document"
                            >
                              <ArrowPathIcon className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteClick(document, section)}
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

              {/* Empty State */}
              {section.expanded && section.documents.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Upload" to add your first document</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Add More Sections Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddSectionModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <FolderPlusIcon className="w-5 h-5" />
            <span>Add More Sections (if needed)</span>
          </motion.button>

        </motion.div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Upload Document</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Description *
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows="3"
                    placeholder="Enter document description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={loading || !uploadData.file || !uploadData.description}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Document Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">File Name</p>
                  <p className="font-medium text-gray-800">{selectedDocument.name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="font-medium text-gray-800">{selectedDocument.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Upload Date</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Upload Time</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedDocument.uploadDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Uploaded By</p>
                    <p className="font-medium text-gray-800">{selectedDocument.uploadedBy}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">File Size</p>
                    <p className="font-medium text-gray-800">{selectedDocument.size}</p>
                  </div>
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
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedDocument && (
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
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Edit Document</h3>
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
                    Document Description
                  </label>
                  <textarea
                    defaultValue={selectedDocument.description}
                    onChange={(e) => setSelectedDocument({ ...selectedDocument, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
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
                  onClick={() => handleUpdateDocument(selectedDocument.description)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Save Changes
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows="3"
                    placeholder="Enter section description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Documents Allowed *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newSection.maxDocuments}
                    onChange={(e) => setNewSection({ ...newSection, maxDocuments: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter maximum number of documents..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Set the maximum number of documents that can be uploaded to this section (1-100)</p>
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
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Section
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Settings Modal */}
      <AnimatePresence>
        {showSectionSettingsModal && selectedSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSectionSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Section Settings</h3>
                <button
                  onClick={() => setShowSectionSettingsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Section Name</p>
                  <p className="font-medium text-gray-800">{selectedSection.title}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Current Documents</p>
                  <p className="font-medium text-gray-800">{selectedSection.documents.length} documents uploaded</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Documents Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={selectedSection.maxDocuments}
                    onChange={(e) => setSelectedSection({ ...selectedSection, maxDocuments: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set the maximum number of documents that can be uploaded (1-100)
                  </p>
                  {selectedSection.documents.length > selectedSection.maxDocuments && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Warning: Current documents exceed the new limit. Existing documents will be kept.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSectionSettingsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateSectionSettings(selectedSection.maxDocuments)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replace Document Modal */}
      <AnimatePresence>
        {showReplaceModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowReplaceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <ArrowPathIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Replace Document</h3>
                    <p className="text-sm text-gray-500">Keep description, update file</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReplaceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-orange-800 mb-2">
                    <strong>Current Document:</strong>
                  </p>
                  <p className="font-medium text-orange-900">{selectedDocument.name || selectedDocument.title}</p>
                  <p className="text-sm text-orange-700 mt-1">{selectedDocument.description}</p>
                  <p className="text-xs text-orange-600 mt-1">Size: {selectedDocument.size}</p>
                  <p className="text-xs text-orange-600">Current file name: {selectedDocument.fileName || selectedDocument.name}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Replace Information</p>
                      <p className="text-sm text-blue-700 mt-1">
                        The document description will remain the same. Only the file will be updated with upload date and size.
                      </p>
                    </div>
                  </div>
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
                        <strong>New file selected:</strong> {replaceFile.name}
                      </p>
                      <p className="text-xs text-green-600">
                        Size: {(replaceFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        📝 Document name will be updated to: <strong>{replaceFile.name}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowReplaceModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplaceDocument}
                  disabled={loading || !replaceFile}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    replaceFile && !loading
                      ? "bg-orange-600 hover:bg-orange-700 text-white hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? 'Replacing...' : 'Replace Document'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedDocument && (
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Delete Document</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>Document to delete:</strong>
                  </p>
                  <p className="font-medium text-red-900">{selectedDocument.name}</p>
                  <p className="text-sm text-red-700 mt-1">{selectedDocument.description}</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Warning</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This will permanently delete the document and cannot be recovered.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To confirm deletion, type <span className="font-bold text-red-600">DELETE</span> in the box below:
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
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  disabled={deleteConfirmText !== "DELETE"}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    deleteConfirmText === "DELETE"
                      ? "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Delete Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Section Confirmation Modal */}
      <AnimatePresence>
        {showDeleteSectionModal && selectedSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteSectionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Delete Section</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteSectionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>Section to delete:</strong>
                  </p>
                  <p className="font-medium text-red-900">{selectedSection.title}</p>
                  <p className="text-sm text-red-700 mt-1">{selectedSection.description}</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Warning</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This will permanently delete the entire section and cannot be recovered.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To confirm deletion, type <span className="font-bold text-red-600">DELETE</span> in the box below:
                  </label>
                  <input
                    type="text"
                    value={deleteSectionConfirmText}
                    onChange={(e) => setDeleteSectionConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteSectionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSection}
                  disabled={deleteSectionConfirmText !== "DELETE"}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    deleteSectionConfirmText === "DELETE"
                      ? "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Delete Section
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplianceCulture;