import React, { useState, useEffect } from 'react';
import { 
  FolderOpenIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  BanknotesIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  GlobeAsiaAustraliaIcon,
  ScaleIcon,
  InformationCircleIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import axios, { fileUploadInstance } from '../../../utils/axios';
import { toast } from 'react-hot-toast';

const MoreSections = ({ client }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    title: '',
    description: '',
    icon: 'DocumentDuplicateIcon',
    color: 'blue'
  });
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [editDocumentData, setEditDocumentData] = useState({ description: '', file: null });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingSectionId, setUploadingSectionId] = useState(null);
  const [uploadData, setUploadData] = useState({ title: '', description: '', file: null });

  // Fetch sections and documents from backend
  useEffect(() => {
    const fetchSectionsAndDocuments = async () => {
      if (client?.email) {
        setLoading(true);
        try {
          // Fetch all documents for this client across all sections
          const documentsResponse = await axios.get(`/section-documents/client/${encodeURIComponent(client.email)}`);
          
          if (documentsResponse.data?.success) {
            setSections(documentsResponse.data.data);
          } else {
            console.error('Failed to fetch sections or documents');
            setSections([]);
          }
        } catch (error) {
          console.error('Error fetching sections and documents:', error);
          setSections([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSectionsAndDocuments();
  }, [client]);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const getColorClasses = (color) => {
    const colors = {
      green: 'from-green-400 to-green-600 border-green-300',
      blue: 'from-blue-400 to-blue-600 border-blue-300',
      purple: 'from-purple-400 to-purple-600 border-purple-300',
      indigo: 'from-indigo-400 to-indigo-600 border-indigo-300',
      red: 'from-red-400 to-red-600 border-red-300',
      orange: 'from-orange-400 to-orange-600 border-orange-300',
      pink: 'from-pink-400 to-pink-600 border-pink-300',
      gray: 'from-gray-400 to-gray-600 border-gray-300',
      cyan: 'from-cyan-400 to-cyan-600 border-cyan-300'
    };
    return colors[color] || colors.gray;
  };

  // Get icon component for section display
  const getIconComponent = (sectionId) => {
    // Map section types to icons
    const iconMapping = {
      'policy-procedure': DocumentDuplicateIcon,
      'training-materials': ClipboardDocumentListIcon,
      'review-reports': ChartPieIcon,
      'meeting-minutes': UserGroupIcon
    };
    return iconMapping[sectionId] || DocumentDuplicateIcon;
  };

  const iconMap = {
    DocumentDuplicateIcon,
    ClipboardDocumentListIcon,
    ChartPieIcon,
    BanknotesIcon,
    UserGroupIcon,
    BuildingOffice2Icon,
    GlobeAsiaAustraliaIcon,
    ScaleIcon,
    InformationCircleIcon
  };

  const handleCreateNewSection = async () => {
    if (newSectionData.title && newSectionData.description) {
      try {
        const response = await axios.post('/section-settings', {
          title: newSectionData.title,
          description: newSectionData.description,
          maxDocuments: 10
        });

        if (response.data?.success) {
          toast.success('Section created successfully');
          
          // Add the new section to the sections list with empty documents
          const newSection = {
            ...response.data.data,
            documents: [],
            documentCount: 0
          };
          setSections([...sections, newSection]);
          
          setNewSectionData({
            title: '',
            description: '',
            icon: 'DocumentDuplicateIcon',
            color: 'blue'
          });
          setShowNewSectionModal(false);
        } else {
          toast.error('Failed to create section');
        }
      } catch (error) {
        console.error('Error creating section:', error);
        toast.error(error.response?.data?.message || 'Failed to create section');
      }
    }
  };

  const handleDeleteCustomSection = (sectionId) => {
    const sectionToDelete = sections.find(section => section.sectionId === sectionId);
    setSectionToDelete(sectionToDelete);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      // Call backend API to delete any section (both custom and default)
      const response = await axios.delete(`/section-settings/${sectionToDelete.sectionId}`);
      
      if (!response.data?.success) {
        toast.error('Failed to delete section');
        return;
      }

      // Remove from frontend state
      toast.success('Section deleted successfully');
      setSections(sections.filter(section => section.sectionId !== sectionToDelete.sectionId));
      setShowDeleteConfirmModal(false);
      setSectionToDelete(null);
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(error.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleFileUpload = (sectionId) => {
    setUploadingSectionId(sectionId);
    setUploadData({ title: '', description: '', file: null });
    setShowUploadModal(true);
  };

  const confirmUploadDocument = async () => {
    if (!uploadData.title || !uploadData.description || !uploadData.file) {
      toast.error('Please fill in all fields and select a file');
      return;
    }

    console.log('🚀 Upload started:', { 
      sectionId: uploadingSectionId, 
      file: uploadData.file?.name, 
      title: uploadData.title,
      description: uploadData.description,
      client: client?.email 
    });

    setUploading(true);
    try {
      console.log('🔄 Creating FormData...');
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('sectionId', uploadingSectionId);
      formData.append('clientEmail', client.email);
      formData.append('description', `${uploadData.title} - ${uploadData.description}`);

      console.log('📤 Making API call to /section-documents/upload...');
      const response = await fileUploadInstance.post('/section-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ API response:', response.data);

      if (response.data?.success) {
        toast.success('Document uploaded successfully');
        console.log('✅ Upload response data:', response.data.data);
        
        // Close modal first
        setShowUploadModal(false);
        setUploadingSectionId(null);
        setUploadData({ title: '', description: '', file: null });
        
        // Refresh all sections from server to get the most up-to-date data
        try {
          const refreshResponse = await axios.get(`/section-documents/client/${encodeURIComponent(client.email)}`);
          if (refreshResponse.data?.success) {
            setSections(refreshResponse.data.data);
            console.log('✅ Sections refreshed successfully');
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh sections:', refreshError);
          // Fallback to local update
          setSections(sections.map(section => {
            if (section.sectionId === uploadingSectionId) {
              return {
                ...section,
                documents: [...(section.documents || []), response.data.data],
                documentCount: (section.documentCount || 0) + 1
              };
            }
            return section;
          }));
        }
      } else {
        console.error('❌ Upload failed - no success in response');
        toast.error('Failed to upload document');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      console.log('🏁 Upload finished');
    }
  };

  const handleDeleteDocument = async (sectionId, docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await axios.delete(`/section-documents/${docId}`);
        
        if (response.data?.success) {
          toast.success('Document deleted successfully');
          
          // Update the sections state to remove the deleted document
          setSections(sections.map(section => {
            if (section.sectionId === sectionId) {
              return {
                ...section,
                documents: section.documents.filter(doc => doc.id !== docId),
                documentCount: section.documentCount - 1
              };
            }
            return section;
          }));
        } else {
          toast.error('Failed to delete document');
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error(error.response?.data?.message || 'Failed to delete document');
      }
    }
  };

  const handleViewDocument = (doc) => {
    console.log('🔍 View document clicked:', doc);
    console.log('📄 Document fileUrl:', doc.fileUrl);
    
    if (doc.fileUrl) {
      console.log('✅ Opening document URL:', doc.fileUrl);
      window.open(doc.fileUrl, '_blank');
    } else {
      console.log('❌ No fileUrl found for document');
      console.log('📊 Available doc properties:', Object.keys(doc));
      toast.error('Document URL not available');
    }
  };

  const handleDownloadDocument = (doc) => {
    console.log('📥 Download document clicked:', doc);
    console.log('📄 Document fileUrl for download:', doc.fileUrl);
    
    if (doc.fileUrl) {
      console.log('✅ Starting download for:', doc.name);
      const link = window.document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      console.log('❌ No fileUrl found for download');
      toast.error('Document download not available');
    }
  };

  const handleEditDocument = (sectionId, doc) => {
    setDocumentToEdit({ ...doc, sectionId });
    setEditDocumentData({ description: doc.description, file: null });
    setShowEditDocumentModal(true);
  };

  const confirmEditDocument = async () => {
    if (!documentToEdit) return;
    
    console.log('🔄 Starting document update:', {
      documentId: documentToEdit.id,
      description: editDocumentData.description,
      hasNewFile: !!editDocumentData.file,
      fileName: editDocumentData.file?.name
    });
    
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('description', editDocumentData.description);
      if (editDocumentData.file) {
        console.log('📎 Adding new file to update:', editDocumentData.file.name);
        formData.append('file', editDocumentData.file);
      }
      
      console.log('📤 Sending PUT request...');
      const response = await fileUploadInstance.put(`/section-documents/${documentToEdit.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Update response received:', response.data);
      
      if (response.data?.success) {
        toast.success('Document updated successfully');
        
        console.log('📊 Backend response data:', response.data.data);
        
        // Update the sections state with complete data from backend
        setSections(sections.map(section => {
          if (section.sectionId === documentToEdit.sectionId) {
            return {
              ...section,
              documents: section.documents.map(doc => 
                doc.id === documentToEdit.id 
                  ? {
                      ...doc,
                      ...response.data.data, // Use complete data from backend
                      // Ensure all necessary fields are included
                      id: response.data.data.id,
                      name: response.data.data.name,
                      description: response.data.data.description,
                      fileUrl: response.data.data.fileUrl,
                      uploadDate: response.data.data.uploadDate,
                      uploadedBy: response.data.data.uploadedBy,
                      size: response.data.data.size
                    }
                  : doc
              )
            };
          }
          return section;
        }));
        
        console.log('✅ Frontend state updated with fileUrl:', response.data.data.fileUrl);
        
        setShowEditDocumentModal(false);
        setDocumentToEdit(null);
        setEditDocumentData({ description: '', file: null });
      } else {
        toast.error('Failed to update document');
      }
    } catch (error) {
      console.error('❌ ERROR updating document:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show appropriate error message
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Update timeout - please try again or refresh the page');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update document');
      }
      
      // Refresh data from server in case of errors to maintain consistency
      try {
        console.log('🔄 Refreshing sections due to update error...');
        const refreshResponse = await axios.get(`/section-documents/client/${encodeURIComponent(client.email)}`);
        if (refreshResponse.data?.success) {
          setSections(refreshResponse.data.data);
          console.log('✅ Sections refreshed after error');
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh sections:', refreshError);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FolderOpenIcon className="h-8 w-8 mr-3 text-indigo-600" />
          Compliance Documentation
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No sections available</p>
            <p className="text-sm text-gray-400 mt-2">Create your first compliance section to get started</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, index) => {
            const IconComponent = getIconComponent(section.sectionId);
            return (
              <motion.div
                key={section.sectionId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <div
                  onClick={() => toggleSection(section.sectionId)}
                  className={`cursor-pointer rounded-xl border-2 transition-all ${
                    expandedSection === section.sectionId 
                      ? 'shadow-2xl transform scale-105' 
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className={`bg-gradient-to-r ${getColorClasses(section.color)} rounded-t-lg p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <IconComponent className="h-6 w-6 mr-3" />
                        <div>
                          <h3 className="font-bold text-lg">{section.title}</h3>
                          <p className="text-sm opacity-90">({section.documentCount || 0} documents)</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomSection(section.sectionId);
                          }}
                          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                          title="Delete Section"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </motion.button>
                        <motion.div
                          animate={{ rotate: expandedSection === section.sectionId ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-white opacity-90">{section.description}</p>
                  </div>

                  {expandedSection === section.sectionId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-gray-50 rounded-b-lg"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-800">Section Documents</h4>
                          <button
                            onClick={() => handleFileUpload(section.sectionId)}
                            disabled={uploading}
                            className={`px-3 py-1 rounded text-sm transition-colors flex items-center ${
                              uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                          >
                            <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                            {uploading ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>

                        {section.documents && section.documents.length > 0 && (
                          <div className="space-y-2">
                            {section.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center space-x-2">
                                  <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium">{doc.name}</p>
                                    <p className="text-xs text-gray-600">{doc.description}</p>
                                    <p className="text-xs text-gray-500">Uploaded: {doc.uploadDate} • {doc.size} • By: {doc.uploadedBy}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleViewDocument(doc)}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                    title="View Document"
                                  >
                                    <EyeIcon className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadDocument(doc)}
                                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                    title="Download Document"
                                  >
                                    <ArrowDownTrayIcon className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleEditDocument(section.sectionId, doc)}
                                    className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors"
                                    title="Edit Document"
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(section.sectionId, doc.id)}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Document"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {(!section.documents || section.documents.length === 0) && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No documents uploaded yet
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Need Additional Sections?</h3>
              <p className="text-sm text-gray-600">Customize compliance sections based on your requirements</p>
            </div>
            <button 
              onClick={() => setShowNewSectionModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Section
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* New Section Modal */}
      {showNewSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Create New Section</h3>
              <button
                onClick={() => setShowNewSectionModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={newSectionData.title}
                  onChange={(e) => setNewSectionData({...newSectionData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter section title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newSectionData.description}
                  onChange={(e) => setNewSectionData({...newSectionData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter section description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <select
                  value={newSectionData.icon}
                  onChange={(e) => setNewSectionData({...newSectionData, icon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DocumentDuplicateIcon">Document</option>
                  <option value="ClipboardDocumentListIcon">Clipboard</option>
                  <option value="ChartPieIcon">Chart</option>
                  <option value="BanknotesIcon">Finance</option>
                  <option value="UserGroupIcon">Users</option>
                  <option value="BuildingOffice2Icon">Building</option>
                  <option value="GlobeAsiaAustraliaIcon">Global</option>
                  <option value="ScaleIcon">Legal</option>
                  <option value="InformationCircleIcon">Information</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {['blue', 'green', 'purple', 'red', 'orange', 'pink', 'indigo', 'cyan'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewSectionData({...newSectionData, color})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newSectionData.color === color ? 'border-gray-800 transform scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: 
                        color === 'blue' ? '#3b82f6' :
                        color === 'green' ? '#10b981' :
                        color === 'purple' ? '#8b5cf6' :
                        color === 'red' ? '#ef4444' :
                        color === 'orange' ? '#f97316' :
                        color === 'pink' ? '#ec4899' :
                        color === 'indigo' ? '#6366f1' :
                        color === 'cyan' ? '#06b6d4' :
                        '#6b7280'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewSectionModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewSection}
                disabled={!newSectionData.title || !newSectionData.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Section
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Upload Document</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadingSectionId(null);
                  setUploadData({ title: '', description: '', file: null });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File *
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {uploadData.file && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {uploadData.file.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadingSectionId(null);
                  setUploadData({ title: '', description: '', file: null });
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUploadDocument}
                disabled={!uploadData.title.trim() || !uploadData.description.trim() || !uploadData.file || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditDocumentModal && documentToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Document</h3>
              <button
                onClick={() => {
                  setShowEditDocumentModal(false);
                  setDocumentToEdit(null);
                  setEditDocumentData({ description: '', file: null });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Document: <span className="text-blue-600">{documentToEdit.name}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={editDocumentData.description}
                  onChange={(e) => setEditDocumentData({ ...editDocumentData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replace File (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setEditDocumentData({ ...editDocumentData, file: e.target.files[0] })}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editDocumentData.file && (
                  <p className="text-sm text-gray-600 mt-1">
                    New file: {editDocumentData.file.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditDocumentModal(false);
                  setDocumentToEdit(null);
                  setEditDocumentData({ description: '', file: null });
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEditDocument}
                disabled={!editDocumentData.description.trim() || updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Document'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Section Confirmation Modal */}
      {showDeleteConfirmModal && sectionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Delete Section</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setSectionToDelete(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-red-800 font-medium">Delete "{sectionToDelete.title}"?</h4>
                    <p className="text-red-700 text-sm mt-1">
                      This will {sectionToDelete.isCustom ? 'permanently delete this custom section' : 'remove this section'} and all its documents ({sectionToDelete.documentCount || 0} documents).
                    </p>
                    <p className="text-red-600 text-sm mt-2 font-medium">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setSectionToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSection}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Section
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MoreSections;