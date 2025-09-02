import React, { useState, useEffect } from 'react';
import { 
  FiFile, FiDownload, FiEye, FiUpload, FiEdit2, FiTrash2, 
  FiSearch, FiFilter, FiExternalLink, FiPlus 
} from 'react-icons/fi';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

const ComplianceResourceCenter = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [categories] = useState([
    'Regulations', 'Guidelines', 'Templates', 'Training', 'Policies', 'Other'
  ]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    tags: '',
    version: '1.0',
    externalLink: '',
    file: null
  });

  useEffect(() => {
    fetchResources();
    fetchStats();
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    filterResources();
  }, [searchTerm, resources]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10
      };
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await axios.get('/compliance-resources', { params });
      setResources(response.data.data);
      setFilteredResources(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/compliance-resources/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterResources = () => {
    let filtered = resources;
    
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredResources(filtered);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form data:', formData);
    console.log('Event:', e);
    
    // Validate required fields
    if (!formData.title || !formData.category || !formData.description) {
      console.error('Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }
    
    const uploadData = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (key === 'file' && formData[key]) {
        console.log('Adding file:', formData[key].name);
        uploadData.append('file', formData[key]);
      } else if (formData[key]) {
        console.log(`Adding ${key}:`, formData[key]);
        uploadData.append(key, formData[key]);
      }
    });

    console.log('FormData prepared, making API call...');
    
    try {
      console.log('Attempting to upload resource...');
      const response = await axios.post('/compliance-resources', uploadData);
      
      toast.success('Resource uploaded successfully');
      setShowUploadModal(false);
      resetForm();
      fetchResources();
      fetchStats();
    } catch (error) {
      console.error('=== API CALL FAILED ===');
      console.error('Error uploading resource:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error('Failed to upload resource: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const updateData = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (key === 'file' && formData[key]) {
        updateData.append('file', formData[key]);
      } else if (formData[key]) {
        updateData.append(key, formData[key]);
      }
    });

    try {
      console.log('Attempting to update resource...', formData);
      const response = await axios.put(
        `/compliance-resources/${selectedResource._id}`, 
        updateData
      );
      
      toast.success('Resource updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchResources();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await axios.delete(`/compliance-resources/${id}`);
        toast.success('Resource deleted successfully');
        fetchResources();
        fetchStats();
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast.error('Failed to delete resource');
      }
    }
  };

  const handleDownload = async (resource) => {
    try {
      await axios.get(`/compliance-resources/${resource._id}/download`);
      
      if (resource.fileUrl) {
        window.open(resource.fileUrl, '_blank');
      } else if (resource.externalLink) {
        window.open(resource.externalLink, '_blank');
      }
      
      fetchResources();
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast.error('Failed to download resource');
    }
  };

  const handleView = async (resource) => {
    try {
      const response = await axios.get(`/compliance-resources/${resource._id}`);
      
      if (resource.fileUrl) {
        window.open(resource.fileUrl, '_blank');
      } else if (resource.externalLink) {
        window.open(resource.externalLink, '_blank');
      }
      
      fetchResources();
    } catch (error) {
      console.error('Error viewing resource:', error);
      toast.error('Failed to view resource');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      description: '',
      tags: '',
      version: '1.0',
      externalLink: '',
      file: null
    });
    setSelectedResource(null);
  };

  const openEditModal = (resource) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      category: resource.category,
      description: resource.description,
      tags: resource.tags.join(', '),
      version: resource.version,
      externalLink: resource.externalLink || '',
      file: null
    });
    setShowEditModal(true);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Regulations': 'bg-red-100 text-red-800',
      'Guidelines': 'bg-blue-100 text-blue-800',
      'Templates': 'bg-green-100 text-green-800',
      'Training': 'bg-purple-100 text-purple-800',
      'Policies': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Compliance Resource Center</h1>
        <p className="text-gray-600">Access and manage compliance documents, guidelines, and resources</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalResources}</p>
              </div>
              <FiFile className="text-3xl text-blue-500" />
            </div>
          </div>
          
          {stats.categoryStats.map((cat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{cat._id}</p>
                  <p className="text-2xl font-bold text-gray-900">{cat.count}</p>
                </div>
                <div className="text-xs text-gray-500">
                  <div>Views: {cat.totalViews}</div>
                  <div>Downloads: {cat.totalDownloads}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => {
                console.log('Add Resource button clicked');
                setShowUploadModal(true);
                console.log('Modal should open now');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiPlus /> Add Resource
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Loading resources...
                  </td>
                </tr>
              ) : filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No resources found
                  </td>
                </tr>
              ) : (
                filteredResources.map(resource => (
                  <tr key={resource._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {resource.fileType === 'link' ? (
                          <FiExternalLink className="text-blue-500" />
                        ) : (
                          <FiFile className="text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{resource.title}</div>
                          {resource.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {resource.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(resource.category)}`}>
                        {resource.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {resource.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      v{resource.version}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {resource.uploadedBy?.firstName} {resource.uploadedBy?.lastName}
                        </div>
                        <div className="text-gray-500">
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiEye /> {resource.viewCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiDownload /> {resource.downloadCount}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(resource)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleDownload(resource)}
                          className="text-green-600 hover:text-green-800"
                          title="Download"
                        >
                          <FiDownload />
                        </button>
                        <button
                          onClick={() => openEditModal(resource)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(resource._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {(showUploadModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {showEditModal ? 'Edit Resource' : 'Upload New Resource'}
            </h2>
            
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <div>Debug Info:</div>
              <div>showUploadModal: {showUploadModal.toString()}</div>
              <div>showEditModal: {showEditModal.toString()}</div>
              <div>Form Data: {JSON.stringify(formData, null, 2)}</div>
            </div>
            
            <form onSubmit={showEditModal ? handleUpdate : handleUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., AML, KYC, Compliance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External Link (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.externalLink}
                    onChange={(e) => setFormData({...formData, externalLink: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/resource"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload File (optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPEG, PNG (Max 50MB)
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    showEditModal ? setShowEditModal(false) : setShowUploadModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {showEditModal ? 'Update' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceResourceCenter;