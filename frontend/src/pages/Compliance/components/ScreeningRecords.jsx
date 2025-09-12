import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  UserGroupIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import axios from '../../../utils/axios';

const ScreeningRecords = ({ client }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [screeningRecords, setScreeningRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, clear: 0, review: 0, alert: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [uploadData, setUploadData] = useState({
    description: '',
    file: null,
    screeningType: 'AML/KYC Screening'  // Default screening type
  });
  const [uploading, setUploading] = useState(false);

  // Fetch screening records from backend API
  useEffect(() => {
    const fetchScreeningRecords = async () => {
      if (client?.email) {
        setLoading(true);
        try {
          console.log('Fetching screening records for client:', client.email);
          const response = await axios.get(`/screening/compliance/client/${encodeURIComponent(client.email)}`);
          console.log('Screening API response:', response.data);
          
          if (response.data && response.data.screenings) {
            // Transform backend data to match frontend expectations
            const transformedRecords = response.data.screenings.map(screening => ({
              id: screening._id,
              type: screening.screeningType,
              date: screening.createdAt ? screening.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              result: screening.result,
              details: screening.details,
              screenedBy: screening.screenedBy?.name || 'System',
              sources: screening.dataSources?.map(ds => ds.name) || [],
              jobNumber: screening.jobId?.jobNumber || 'Unknown',
              jobId: screening.jobId?._id,
              riskScore: screening.riskScore,
              findings: screening.findings || [],
              reviewNotes: screening.reviewNotes,
              document: screening.documents && screening.documents.length > 0 ? screening.documents[0] : null
            }));
            
            setScreeningRecords(transformedRecords);
            setSummary(response.data.summary || { total: 0, clear: 0, review: 0, alert: 0, pending: 0 });
          }
        } catch (error) {
          console.error('Error fetching screening records:', error);
          // Fallback to empty state
          setScreeningRecords([]);
          setSummary({ total: 0, clear: 0, review: 0, alert: 0, pending: 0 });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchScreeningRecords();
  }, [client]);

  // Handle document upload
  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.description) {
      alert('Please provide both file and description');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('description', uploadData.description);
      formData.append('screeningType', uploadData.screeningType);
      formData.append('clientGmail', client.email);

      // Upload to screening records endpoint
      const response = await axios.post('/screening/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        // Add new document to local state
        const newRecord = {
          id: response.data.document.id || Date.now().toString(),
          type: uploadData.screeningType,
          date: new Date().toISOString().split('T')[0],
          result: 'pending',
          details: uploadData.description,
          screenedBy: 'Current User',
          sources: [],
          document: response.data.document
        };

        setScreeningRecords([newRecord, ...screeningRecords]);
        setShowUploadModal(false);
        setUploadData({ description: '', file: null, screeningType: 'AML/KYC Screening' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Handle document edit
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setUploadData({
      description: record.document?.description || record.details,
      file: null,
      screeningType: record.type  // Keep original screening type
    });
    setShowEditModal(true);
  };

  // Handle document delete
  const handleDelete = async (record) => {
    if (!record.document || !record.document.id) {
      // If no document, delete the entire screening record
      if (!window.confirm(`Are you sure you want to delete this ${record.type} screening record?`)) {
        return;
      }
      try {
        await axios.delete(`/screening/${record.id}`);
        setScreeningRecords(screeningRecords.filter(r => r.id !== record.id));
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete screening record');
      }
      return;
    }

    // If document exists, delete just the document
    if (!window.confirm(`Are you sure you want to delete the document from this ${record.type} record?`)) {
      return;
    }

    try {
      await axios.delete(`/screening/documents/${record.document.id}`, {
        data: {
          clientGmail: client.email,
          screeningType: record.type
        }
      });
      
      // Update the record to remove the document
      const updatedRecords = screeningRecords.map(r => 
        r.id === record.id 
          ? { ...r, document: null }
          : r
      );
      setScreeningRecords(updatedRecords);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    }
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!uploadData.description) {
      alert('Please provide a description');
      return;
    }

    if (!client?.email) {
      alert('Client email is not available');
      return;
    }

    if (!uploadData.screeningType) {
      alert('Screening type is required');
      return;
    }

    if (!selectedRecord.document || !selectedRecord.document.id) {
      alert('No document found to edit');
      return;
    }

    setUploading(true);
    try {
      console.log('Edit save - Client:', client);
      console.log('Edit save - Client email:', client?.email);
      console.log('Edit save - Upload data:', uploadData);
      console.log('Edit save - Selected record:', selectedRecord);

      const updateData = {
        description: uploadData.description,
        screeningType: uploadData.screeningType,
        clientGmail: client?.email
      };

      if (uploadData.file) {
        const formData = new FormData();
        formData.append('file', uploadData.file);
        formData.append('description', uploadData.description);
        formData.append('screeningType', uploadData.screeningType);
        formData.append('clientGmail', client?.email || '');
        
        await axios.put(`/screening/documents/${selectedRecord.document.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.put(`/screening/documents/${selectedRecord.document.id}`, updateData);
      }

      // Update local state
      setScreeningRecords(screeningRecords.map(record => 
        record.id === selectedRecord.id 
          ? { ...record, details: uploadData.description, type: uploadData.screeningType }
          : record
      ));
      
      setShowEditModal(false);
      setSelectedRecord(null);
      setUploadData({ description: '', file: null, screeningType: 'PEP Check' });
    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to update document');
    } finally {
      setUploading(false);
    }
  };

  // Handle document view
  const handleView = (record) => {
    if (record.document && record.document.fileUrl) {
      window.open(record.document.fileUrl, '_blank');
    } else {
      alert('No document file available for viewing');
    }
  };

  // Handle document download
  const handleDownload = async (record) => {
    if (record.document && record.document.fileUrl) {
      try {
        const response = await fetch(record.document.fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = record.document.name || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Download error:', error);
        // Fallback to opening in new tab
        window.open(record.document.fileUrl, '_blank');
      }
    } else {
      alert('No document file available for download');
    }
  };

  const screeningTypes = [
    { name: 'AML/KYC Screening', icon: ShieldCheckIcon, color: 'blue' },
    { name: 'PEP Check', icon: UserGroupIcon, color: 'blue' },
    { name: 'Sanctions Screening', icon: ShieldCheckIcon, color: 'purple' },
    { name: 'Adverse Media Check', icon: GlobeAltIcon, color: 'orange' },
    { name: 'Criminal Records Check', icon: ExclamationTriangleIcon, color: 'red' },
    { name: 'Financial Crime Check', icon: DocumentMagnifyingGlassIcon, color: 'yellow' },
    { name: 'Enhanced Due Diligence', icon: DocumentMagnifyingGlassIcon, color: 'green' }
  ];

  const getResultBadge = (result) => {
    switch (result) {
      case 'clear':
        return (
          <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            <CheckBadgeIcon className="h-4 w-4 mr-1" />
            Clear
          </span>
        );
      case 'review':
        return (
          <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
            Review Required
          </span>
        );
      case 'alert':
        return (
          <span className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Alert
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRecords = screeningRecords.filter(record => {
    const matchesFilter = activeFilter === 'all' || record.result === activeFilter;
    const matchesSearch = record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });


  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6"
      >
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <ShieldCheckIcon className="h-8 w-8 mr-3 text-purple-600" />
            Screening Records
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            <span>Upload Document</span>
          </motion.button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search screening records..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'clear', 'review', 'alert'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading screening records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No screening records found</p>
            </div>
          ) : filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-xl p-5 hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{record.type}</h3>
                    {record.jobNumber && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        Job: {record.jobNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{record.details}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    {record.document && record.document.fileUrl && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleView(record)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Document"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownload(record)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Download Document"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(record)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(record)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                  {getResultBadge(record.result)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Date: {record.date}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>By: {record.screenedBy}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <GlobeAltIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Sources: {record.sources.length}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  {record.document && record.document.fileUrl ? (
                    <>
                      <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-green-600">Document: {record.document.name}</span>
                    </>
                  ) : (
                    <>
                      <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>No document</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Data Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {record.sources.map((source, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                      {source}
                    </span>
                  ))}
                </div>
              </div>

            </motion.div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Screening Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{summary.total}</p>
              <p className="text-sm text-gray-600">Total Screenings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{summary.clear}</p>
              <p className="text-sm text-gray-600">Clear Results</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{summary.review}</p>
              <p className="text-sm text-gray-600">Under Review</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{summary.alert}</p>
              <p className="text-sm text-gray-600">Alerts</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Upload Screening Document</h3>
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
                  Description *
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  rows="3"
                  placeholder="Enter screening document description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document File *
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PDF, DOC, DOCX, JPEG, PNG (Max 50MB)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadData.file || !uploadData.description}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Screening Record</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRecord(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  rows="3"
                  placeholder="Enter screening document description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replace Document (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep current file. Supported: PDF, DOC, DOCX, JPEG, PNG (Max 50MB)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={uploading || !uploadData.description}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ScreeningRecords;