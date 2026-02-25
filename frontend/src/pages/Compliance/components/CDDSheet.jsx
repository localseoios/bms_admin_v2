import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  EyeIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import axios, { fileUploadInstance } from '../../../utils/axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const CDDSheet = ({ client }) => {
  const [cddData, setCddData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState({ open: false, jobId: null });
  const [editModal, setEditModal] = useState({ open: false, jobId: null, document: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, jobId: null, documentId: null, documentTitle: '' });
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState([]);

  useEffect(() => {
    if (client?.jobs && client.jobs.length > 0) {
      fetchCddDocuments();
    }
  }, [client]);

  const fetchCddDocuments = async () => {
    if (!client?.jobs || client.jobs.length === 0) return;

    setLoading(true);
    try {
      const cddPromises = client.jobs.map(async (job) => {
        try {
          const response = await axios.get(`/operations/jobs/${job._id}/cdd-details`);
          return {
            jobId: job._id,
            jobNumber: job.jobNumber,
            serviceType: job.serviceType,
            documents: response.data?.documents || []
          };
        } catch (error) {
          console.error(`Error fetching CDD for job ${job._id}:`, error);
          return {
            jobId: job._id,
            jobNumber: job.jobNumber,
            serviceType: job.serviceType,
            documents: []
          };
        }
      });

      const results = await Promise.all(cddPromises);
      setCddData(results);
    } catch (error) {
      console.error('Error fetching CDD documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setFileDetails(files.map(file => ({
      file,
      title: '',
      description: ''
    })));
  };

  const updateFileDetail = (index, field, value) => {
    setFileDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFileDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (jobId) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    const hasEmptyTitles = fileDetails.some(fd => !fd.title.trim());
    if (hasEmptyTitles) {
      toast.error('Please enter a title for all documents');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      fileDetails.forEach((fd, index) => {
        formData.append('documents', fd.file);
        formData.append(`title_${index}`, fd.title);
        formData.append(`description_${index}`, fd.description);
      });

      await fileUploadInstance.post(`/operations/jobs/${jobId}/cdd-documents`, formData);

      toast.success(`${selectedFiles.length} document${selectedFiles.length > 1 ? 's' : ''} uploaded successfully`);
      setUploadModal({ open: false, jobId: null });
      setSelectedFiles([]);
      setFileDetails([]);
      fetchCddDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadModal = () => {
    setUploadModal({ open: false, jobId: null });
    setSelectedFiles([]);
    setFileDetails([]);
  };

  const handleUpdate = async (jobId, documentId, title, description, file) => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      if (file) {
        formData.append('document', file);
      }
      formData.append('title', title);
      formData.append('description', description);

      await fileUploadInstance.put(`/operations/jobs/${jobId}/cdd-documents/${documentId}`, formData);

      toast.success('Document updated successfully');
      setEditModal({ open: false, jobId: null, document: null });
      fetchCddDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error(error.response?.data?.message || 'Failed to update document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (jobId, documentId) => {
    try {
      setUploading(true);
      await axios.delete(`/operations/jobs/${jobId}/cdd-documents/${documentId}`);

      toast.success('Document deleted successfully');
      setDeleteModal({ open: false, jobId: null, documentId: null, documentTitle: '' });
      fetchCddDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <span className="ml-3 text-gray-600">Loading CDD documents...</span>
        </div>
      </div>
    );
  }

  // Deduplicate CDD documents by fileName (since they are synced across all jobs)
  const deduplicatedDocs = [];
  const docFileNameSet = new Map();

  cddData.forEach(jobData => {
    if (jobData.documents && jobData.documents.length > 0) {
      jobData.documents.forEach(doc => {
        const fileNameKey = (doc.fileName || '').toLowerCase().trim();
        if (!fileNameKey) return;

        const existing = docFileNameSet.get(fileNameKey);
        if (!existing) {
          docFileNameSet.set(fileNameKey, {
            ...doc,
            jobId: jobData.jobId,
            jobNumber: jobData.jobNumber
          });
        }
      });
    }
  });

  docFileNameSet.forEach(doc => deduplicatedDocs.push(doc));

  const totalDocuments = deduplicatedDocs.length;

  // Get the first job for adding new documents
  const firstJob = client?.jobs?.[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-white mr-3" />
            <h2 className="text-xl font-bold text-white">CDD Documents</h2>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <span className="text-white font-medium">{totalDocuments} Document{totalDocuments !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Add Document Button */}
        {firstJob && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setUploadModal({ open: true, jobId: firstJob._id })}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Document
            </button>
          </div>
        )}

        {deduplicatedDocs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <ShieldCheckIcon className="h-16 w-16 text-teal-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No CDD Documents</h3>
            <p className="text-gray-500">No Customer Due Diligence documents have been uploaded yet.</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deduplicatedDocs.map((doc, docIndex) => (
              <motion.div
                key={doc._id || docIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: docIndex * 0.05 }}
                className="bg-white border border-teal-100 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-teal-200"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="h-5 w-5 text-teal-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {doc.title || 'Untitled Document'}
                    </h4>
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {doc.uploadedAt
                        ? format(new Date(doc.uploadedAt), 'MMM dd, yyyy')
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-teal-50 flex flex-wrap gap-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    <EyeIcon className="h-3.5 w-3.5 mr-1" />
                    View
                  </a>
                  <button
                    onClick={() => setEditModal({ open: true, jobId: doc.jobId, document: doc })}
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <PencilIcon className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteModal({
                      open: true,
                      jobId: doc.jobId,
                      documentId: doc._id,
                      documentTitle: doc.title || 'Untitled Document'
                    })}
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {uploadModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={resetUploadModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload CDD Documents</h3>
                <button
                  onClick={resetUploadModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Documents <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    onChange={handleFilesSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                  />
                  <p className="mt-1 text-xs text-gray-500">You can select multiple files at once</p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-4 mt-4">
                    <div className="text-sm font-medium text-gray-700">
                      {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                    </div>

                    {fileDetails.map((fd, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-teal-600 mr-2" />
                            <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {fd.file.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={fd.title}
                              onChange={(e) => updateFileDetail(index, 'title', e.target.value)}
                              placeholder="Enter title..."
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2 border"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={fd.description}
                              onChange={(e) => updateFileDetail(index, 'description', e.target.value)}
                              placeholder="Enter description (optional)..."
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2 border"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetUploadModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpload(uploadModal.jobId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
                    disabled={uploading || selectedFiles.length === 0}
                  >
                    {uploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editModal.open && editModal.document && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditModal({ open: false, jobId: null, document: null })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit CDD Document</h3>
                <button
                  onClick={() => setEditModal({ open: false, jobId: null, document: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500">Current File:</p>
                <p className="text-sm font-medium text-gray-900 truncate">{editModal.document.fileName}</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleUpdate(
                    editModal.jobId,
                    editModal.document._id,
                    formData.get('title'),
                    formData.get('description'),
                    formData.get('document')?.size > 0 ? formData.get('document') : null
                  );
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editModal.document.title}
                    placeholder="Enter document title..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2 border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    defaultValue={editModal.document.description}
                    placeholder="Enter description (optional)..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm px-3 py-2 border resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Replace Document <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="file"
                    name="document"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty to keep the current file</p>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setEditModal({ open: false, jobId: null, document: null })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
                    disabled={uploading}
                  >
                    {uploading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteModal({ open: false, jobId: null, documentId: null, documentTitle: '' })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrashIcon className="h-5 w-5 text-red-500 mr-2" />
                  Delete Document
                </h3>
                <button
                  onClick={() => setDeleteModal({ open: false, jobId: null, documentId: null, documentTitle: '' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Are you sure you want to delete this document?</p>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-md">
                  {deleteModal.documentTitle}
                </p>
                <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModal({ open: false, jobId: null, documentId: null, documentTitle: '' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteModal.jobId, deleteModal.documentId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CDDSheet;
