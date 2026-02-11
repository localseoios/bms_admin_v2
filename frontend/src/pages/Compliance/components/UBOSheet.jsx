import React, { useState, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  UserGroupIcon,
  EyeIcon,
  CalendarIcon,
  FolderOpenIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import axios, { fileUploadInstance } from '../../../utils/axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const UBOSheet = ({ client }) => {
  const [uboData, setUboData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUbo, setEditingUbo] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const fileInputRef = useRef(null);

  const isOfficeFile = (url) => {
    if (!url) return false;
    const extension = url.toLowerCase().split('.').pop().split('?')[0];
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension);
  };

  const isPublicUrl = (url) => {
    return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
  };

  const openDocument = (url) => {
    if (!url) {
      alert('Document not available');
      return;
    }
    if (isOfficeFile(url) && isPublicUrl(url)) {
      window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    passportNo: '',
    qidNo: '',
    nationality: '',
    documents: [],
    existingDocuments: []
  });

  useEffect(() => {
    if (client?.jobs && client.jobs.length > 0) {
      fetchUboDocuments();
    }
  }, [client]);

  const fetchUboDocuments = async () => {
    if (!client?.jobs || client.jobs.length === 0) return;

    setLoading(true);
    try {
      const uboPromises = client.jobs.map(async (job) => {
        try {
          const response = await axios.get(`/operations/jobs/${job._id}/ubo-details`);
          return {
            jobId: job._id,
            jobNumber: job.jobNumber,
            serviceType: job.serviceType,
            ubos: response.data?.ubos || []
          };
        } catch (error) {
          console.error(`Error fetching UBO for job ${job._id}:`, error);
          return {
            jobId: job._id,
            jobNumber: job.jobNumber,
            serviceType: job.serviceType,
            ubos: []
          };
        }
      });

      const results = await Promise.all(uboPromises);
      setUboData(results);
    } catch (error) {
      console.error('Error fetching UBO documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = (jobId) => {
    setSelectedJob(jobId);
    setEditingUbo(null);
    setFormData({
      name: '',
      passportNo: '',
      qidNo: '',
      nationality: '',
      documents: [],
      existingDocuments: []
    });
    setShowModal(true);
  };

  const handleEditClick = (jobId, ubo) => {
    setSelectedJob(jobId);
    setEditingUbo(ubo);
    setFormData({
      name: ubo.name || '',
      passportNo: ubo.passportNo || '',
      qidNo: ubo.qidNo || '',
      nationality: ubo.nationality || '',
      documents: [],
      existingDocuments: ubo.documents || []
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const removeNewDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const removeExistingDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      existingDocuments: prev.existingDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !selectedJob) {
      toast.error('Please enter UBO name');
      return;
    }

    setUploading(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('passportNo', formData.passportNo);
      submitData.append('qidNo', formData.qidNo);
      submitData.append('nationality', formData.nationality);
      submitData.append('existingDocuments', JSON.stringify(formData.existingDocuments));

      formData.documents.forEach((file) => {
        submitData.append('documents', file);
      });

      if (editingUbo) {
        await fileUploadInstance.put(`/operations/jobs/${selectedJob}/ubo-persons/${editingUbo._id}`, submitData);
        toast.success('UBO updated successfully');
      } else {
        await fileUploadInstance.post(`/operations/jobs/${selectedJob}/ubo-persons`, submitData);
        toast.success('UBO added successfully');
      }

      setShowModal(false);
      setFormData({
        name: '',
        passportNo: '',
        qidNo: '',
        nationality: '',
        documents: [],
        existingDocuments: []
      });
      await fetchUboDocuments();
    } catch (error) {
      console.error('Error saving UBO:', error);
      toast.error('Failed to save UBO');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUbo = async (jobId, uboId) => {
    if (!confirm('Are you sure you want to delete this UBO?')) return;

    setDeleting(uboId);
    try {
      await axios.delete(`/operations/jobs/${jobId}/ubo-persons/${uboId}`);
      toast.success('UBO deleted successfully');
      await fetchUboDocuments();
    } catch (error) {
      console.error('Error deleting UBO:', error);
      toast.error('Failed to delete UBO');
    } finally {
      setDeleting(null);
    }
  };

  const handleAddDocument = async (jobId, uboId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setDeleting(uboId);
      try {
        const formData = new FormData();
        formData.append('document', file);
        await fileUploadInstance.post(`/operations/jobs/${jobId}/ubo-persons/${uboId}/documents`, formData);
        toast.success('Document added successfully');
        await fetchUboDocuments();
      } catch (error) {
        console.error('Error adding document:', error);
        toast.error('Failed to add document');
      } finally {
        setDeleting(null);
      }
    };
    input.click();
  };

  const handleDeleteDocument = async (jobId, uboId, documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setDeleting(documentId);
    try {
      await axios.delete(`/operations/jobs/${jobId}/ubo-persons/${uboId}/documents/${documentId}`);
      toast.success('Document deleted successfully');
      await fetchUboDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const handleReplaceDocument = async (jobId, uboId, documentId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setDeleting(documentId);
      try {
        const formData = new FormData();
        formData.append('document', file);
        await fileUploadInstance.put(`/operations/jobs/${jobId}/ubo-persons/${uboId}/documents/${documentId}`, formData);
        toast.success('Document replaced successfully');
        await fetchUboDocuments();
      } catch (error) {
        console.error('Error replacing document:', error);
        toast.error('Failed to replace document');
      } finally {
        setDeleting(null);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <span className="ml-3 text-gray-600">Loading UBO data...</span>
        </div>
      </div>
    );
  }

  const totalUbos = uboData.reduce((sum, job) => sum + (job.ubos?.length || 0), 0);
  const totalDocuments = uboData.reduce((sum, job) => {
    return sum + (job.ubos?.reduce((docSum, ubo) => docSum + (ubo.documents?.length || 0), 0) || 0);
  }, 0);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-white mr-3" />
              <h2 className="text-xl font-bold text-white">UBO Details</h2>
            </div>
            <div className="flex gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-white font-medium">{totalUbos} UBO{totalUbos !== 1 ? 's' : ''}</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-white font-medium">{totalDocuments} Doc{totalDocuments !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {client?.jobs?.map((job, jobIndex) => {
              const jobData = uboData.find(u => u.jobId === job._id) || { ubos: [] };
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: jobIndex * 0.1 }}
                  className="border border-pink-100 rounded-xl overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-3 border-b border-pink-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FolderOpenIcon className="h-5 w-5 text-pink-600 mr-2" />
                        <span className="font-medium text-gray-900">Job: {job.jobNumber}</span>
                        <span className="ml-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                          {job.serviceType}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddClick(job._id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add UBO
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    {!jobData.ubos || jobData.ubos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <UserGroupIcon className="h-12 w-12 text-pink-200 mx-auto mb-2" />
                        <p>No UBO data for this job</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobData.ubos.map((ubo, uboIndex) => (
                          <motion.div
                            key={ubo._id || uboIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: uboIndex * 0.05 }}
                            className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {(ubo.name || 'U')[0].toUpperCase()}
                                </div>
                                <div className="ml-3">
                                  <h4 className="font-semibold text-gray-900">{ubo.name || 'Unnamed UBO'}</h4>
                                  <p className="text-sm text-gray-500">{ubo.nationality || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditClick(job._id, ubo)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUbo(job._id, ubo._id)}
                                  disabled={deleting === ubo._id}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete"
                                >
                                  {deleting === ubo._id ? (
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                              <div className="bg-white rounded-lg p-2">
                                <span className="text-gray-500">Passport No:</span>
                                <span className="ml-2 font-medium text-gray-900">{ubo.passportNo || '-'}</span>
                              </div>
                              <div className="bg-white rounded-lg p-2">
                                <span className="text-gray-500">QID No:</span>
                                <span className="ml-2 font-medium text-gray-900">{ubo.qidNo || '-'}</span>
                              </div>
                            </div>

                            {/* Documents Section */}
                            <div className="border-t border-pink-100 pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 flex items-center">
                                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                                  Documents ({ubo.documents?.length || 0})
                                </span>
                                <button
                                  onClick={() => handleAddDocument(job._id, ubo._id)}
                                  disabled={deleting === ubo._id}
                                  className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center"
                                >
                                  <PlusIcon className="h-3 w-3 mr-1" />
                                  Add Document
                                </button>
                              </div>

                              {ubo.documents && ubo.documents.length > 0 ? (
                                <div className="grid gap-2">
                                  {ubo.documents.map((doc, docIndex) => (
                                    <div
                                      key={doc._id || docIndex}
                                      className="flex items-center justify-between bg-white rounded-lg p-2 text-sm"
                                    >
                                      <div className="flex items-center flex-1 min-w-0">
                                        <DocumentTextIcon className="h-4 w-4 text-pink-500 flex-shrink-0" />
                                        <span className="ml-2 truncate text-gray-700">{doc.fileName || doc.title || 'Document'}</span>
                                      </div>
                                      <div className="flex items-center gap-2 ml-2">
                                        <button
                                          onClick={() => openDocument(doc.fileUrl)}
                                          className="text-blue-600 hover:text-blue-700"
                                          title="View"
                                        >
                                          <EyeIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleReplaceDocument(job._id, ubo._id, doc._id)}
                                          disabled={deleting === doc._id}
                                          className="text-green-500 hover:text-green-600 disabled:opacity-50"
                                          title="Replace"
                                        >
                                          <ArrowPathIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDocument(job._id, ubo._id, doc._id)}
                                          disabled={deleting === doc._id}
                                          className="text-red-500 hover:text-red-600 disabled:opacity-50"
                                          title="Delete"
                                        >
                                          {deleting === doc._id ? (
                                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <TrashIcon className="h-4 w-4" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 text-center py-2">No documents attached</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit UBO Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingUbo ? 'Edit UBO' : 'Add UBO'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* UBO Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    UBO Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="UBO Name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                        <input
                          type="text"
                          value={formData.passportNo}
                          onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Passport No"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">QID Number</label>
                        <input
                          type="text"
                          value={formData.qidNo}
                          onChange={(e) => setFormData({ ...formData, qidNo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="QID No"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Nationality"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    Documents
                  </h4>

                  {/* Existing Documents */}
                  {formData.existingDocuments.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs text-gray-500">Existing Documents:</p>
                      {formData.existingDocuments.map((doc, index) => (
                        <div
                          key={doc._id || index}
                          className="flex items-center justify-between bg-white rounded-lg p-2 text-sm"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <DocumentTextIcon className="h-4 w-4 text-pink-500 flex-shrink-0" />
                            <span className="ml-2 truncate text-gray-700">{doc.fileName || doc.title}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              type="button"
                              onClick={() => openDocument(doc.fileUrl)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExistingDocument(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Documents */}
                  {formData.documents.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs text-gray-500">New Documents to Upload:</p>
                      {formData.documents.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-green-50 rounded-lg p-2 text-sm"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <DocumentTextIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="ml-2 truncate text-gray-700">{file.name}</span>
                            <span className="ml-2 text-xs text-gray-400">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewDocument(index)}
                            className="text-red-500 hover:text-red-600 ml-2"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload documents
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, DOC, DOCX, JPG, PNG
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name || uploading}
                  className="flex-1 px-4 py-2 text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="inline-flex items-center justify-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {editingUbo ? 'Save Changes' : 'Add UBO'}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UBOSheet;
