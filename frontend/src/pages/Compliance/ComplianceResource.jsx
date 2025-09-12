import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
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
  BellAlertIcon,
  ScaleIcon,
  LinkIcon,
  GlobeAltIcon,
  DocumentMagnifyingGlassIcon,
  BookOpenIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

// Edit Resource Form Component
const EditResourceForm = ({ document, onUpdate, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    description: document.description || '',
    externalLink: document.link || '',
    file: null,
    replaceFile: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = {
      description: formData.description,
      externalLink: formData.externalLink
    };
    
    if (formData.replaceFile && formData.file) {
      updateData.file = formData.file;
    }
    
    onUpdate(updateData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Description Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resource Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
          rows="3"
          required
          placeholder="Update resource description..."
        />
      </div>

      {/* Link Update (for link resources) */}
      {document.isLink && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            External Link
          </label>
          <input
            type="url"
            value={formData.externalLink}
            onChange={(e) => setFormData({...formData, externalLink: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="https://example.com"
          />
          <p className="text-xs text-gray-500 mt-1">Update the link URL if needed</p>
        </div>
      )}

      {/* File Replace (for file resources) */}
      {!document.isLink && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              id="replaceFile"
              checked={formData.replaceFile}
              onChange={(e) => setFormData({...formData, replaceFile: e.target.checked, file: null})}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="replaceFile" className="text-sm font-medium text-gray-700">
              Replace current file
            </label>
          </div>
          
          {formData.replaceFile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New File *
              </label>
              <input
                type="file"
                onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                required={formData.replaceFile}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPEG, PNG (Max 50MB)
              </p>
            </div>
          )}
          
          {!formData.replaceFile && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Current file: <span className="font-medium">{document.name}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Check "Replace current file" to upload a new file
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.description || (formData.replaceFile && !formData.file)}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

const ComplianceResource = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([
    {
      id: "authority-notification",
      title: "Authority Notification Checking",
      description: "Official notifications and compliance alerts from regulatory authorities",
      icon: BellAlertIcon,
      color: "red",
      documents: [],
      expanded: true,
      maxDocuments: 20,
    },
    {
      id: "aml-cft-law",
      title: "AML/CFT Law",
      description: "Anti-Money Laundering and Counter-Financing of Terrorism laws and regulations",
      icon: ScaleIcon,
      color: "blue",
      documents: [],
      expanded: true,
      maxDocuments: 15,
    },
    {
      id: "aml-cft-links",
      title: "AML/CFT Links",
      description: "Important links and references for AML/CFT compliance resources",
      icon: LinkIcon,
      color: "green",
      documents: [],
      expanded: true,
      maxDocuments: 25,
    },
    {
      id: "gci-link",
      title: "GCI Link",
      description: "Global Compliance Index links and related documentation",
      icon: GlobeAltIcon,
      color: "purple",
      documents: [],
      expanded: true,
      maxDocuments: 15,
    },
    {
      id: "outside-source",
      title: "Outside Source",
      description: "External compliance resources and third-party documentation",
      icon: DocumentMagnifyingGlassIcon,
      color: "orange",
      documents: [],
      expanded: true,
      maxDocuments: 20,
    },
    {
      id: "compliance-culture",
      title: "Compliance Culture Documents",
      description: "Training materials, policies, and resources for building compliance culture",
      icon: AcademicCapIcon,
      color: "cyan",
      documents: [],
      expanded: true,
      maxDocuments: 30,
    },
  ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showSectionSettingsModal, setShowSectionSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadData, setUploadData] = useState({
    description: "",
    file: null,
    isLink: false,
    externalLink: "",
    tags: ""
  });
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
    maxDocuments: 10,
  });
  const [loading, setLoading] = useState(false);

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

  // Load resources and section settings from backend
  useEffect(() => {
    fetchResources();
    fetchSectionSettings();
  }, []);

  const fetchSectionSettings = async () => {
    try {
      console.log('Fetching section settings...');
      const response = await axios.get('/section-settings');
      
      // Update sections with backend settings and add custom sections
      const settingsMap = {};
      const customSections = [];
      const colors = ["blue", "green", "purple", "orange", "red", "pink", "cyan", "yellow"];
      
      response.data.data.forEach(setting => {
        settingsMap[setting.sectionId] = setting;
        
        // Check if this is a custom section
        if (setting.sectionId.startsWith('custom-')) {
          customSections.push({
            id: setting.sectionId,
            title: setting.title,
            description: setting.description,
            icon: BookOpenIcon,
            color: setting.color || colors[customSections.length % colors.length],
            documents: [],
            expanded: true,
            isCustom: true,
            maxDocuments: setting.maxDocuments,
          });
        }
      });
      
      setSections(prevSections => {
        // Update existing sections with backend settings
        const updatedSections = prevSections.map(section => ({
          ...section,
          maxDocuments: settingsMap[section.id]?.maxDocuments || section.maxDocuments
        }));
        
        // Add custom sections that aren't already in the list
        const existingIds = updatedSections.map(s => s.id);
        const newCustomSections = customSections.filter(cs => !existingIds.includes(cs.id));
        
        return [...updatedSections, ...newCustomSections];
      });
      
      console.log('Section settings loaded:', settingsMap);
      console.log('Custom sections found:', customSections.length);
    } catch (error) {
      console.error('Error fetching section settings:', error);
      // Continue with default settings if API fails
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      // Fetch general compliance resources
      const response = await axios.get('/compliance-resources', {
        params: { limit: 100 }
      });
      
      // Fetch compliance culture documents separately
      let cultureDocuments = [];
      try {
        const cultureResponse = await axios.get('/compliance-culture', {
          params: { limit: 100, status: 'active' }
        });
        cultureDocuments = cultureResponse.data.data || [];
      } catch (cultureError) {
        console.log('Compliance culture API not available yet');
      }
      
      // Group resources by section based on tags or category
      const groupedResources = {};
      response.data.data.forEach(resource => {
        const sectionId = mapResourceToSection(resource);
        if (!groupedResources[sectionId]) {
          groupedResources[sectionId] = [];
        }
        groupedResources[sectionId].push({
          id: resource._id,
          name: resource.title,
          description: resource.description,
          uploadDate: resource.createdAt,
          size: resource.fileType === 'link' ? 'Link' : 'File',
          uploadedBy: `${resource.uploadedBy?.firstName || ''} ${resource.uploadedBy?.lastName || ''}`.trim() || 'Unknown',
          isLink: resource.fileType === 'link',
          link: resource.externalLink,
          fileUrl: resource.fileUrl,
          tags: resource.tags,
          version: resource.version,
          isFromCultureAPI: false
        });
      });
      
      // Add compliance culture documents to the compliance-culture section
      if (cultureDocuments.length > 0) {
        groupedResources['compliance-culture'] = cultureDocuments.map(doc => ({
          id: doc._id,
          name: doc.title,
          description: doc.description,
          uploadDate: doc.createdAt,
          size: doc.fileType === 'link' ? 'Link' : `${doc.fileSize || 'File'}`,
          uploadedBy: `${doc.uploadedBy?.firstName || ''} ${doc.uploadedBy?.lastName || ''}`.trim() || 'Unknown',
          isLink: doc.fileType === 'link',
          link: doc.externalLink,
          fileUrl: doc.fileUrl,
          tags: doc.tags,
          version: doc.version,
          documentType: doc.documentType,
          category: doc.category,
          isImportant: doc.isImportant,
          targetAudience: doc.targetAudience,
          isFromCultureAPI: true
        }));
      }

      // Update sections with fetched documents
      setSections(prevSections => 
        prevSections.map(section => ({
          ...section,
          documents: groupedResources[section.id] || []
        }))
      );
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const mapResourceToSection = (resource) => {
    // Check tags first for custom sections
    if (resource.tags && resource.tags.length > 0) {
      for (const tag of resource.tags) {
        // If tag matches a custom section ID, return that
        if (tag.startsWith('custom-')) {
          return tag;
        }
      }
      
      // Check for specific section tags
      if (resource.tags.includes('authority-notification')) {
        return 'authority-notification';
      }
      if (resource.tags.includes('aml-cft-law')) {
        return 'aml-cft-law';
      }
      if (resource.tags.includes('aml-cft-links')) {
        return 'aml-cft-links';
      }
      if (resource.tags.includes('gci-link')) {
        return 'gci-link';
      }
      if (resource.tags.includes('outside-source')) {
        return 'outside-source';
      }
      if (resource.tags.includes('compliance-culture')) {
        return 'compliance-culture';
      }
    }
    
    // Fallback to category mapping
    const category = resource.category?.toLowerCase();
    if (category === 'regulations') {
      return 'authority-notification';
    } else if (category === 'guidelines') {
      return 'aml-cft-law';
    } else if (category === 'templates') {
      return 'aml-cft-links';
    } else if (category === 'policies') {
      return 'gci-link';
    } else if (category === 'training') {
      return 'compliance-culture';
    } else {
      return 'outside-source';
    }
  };

  const getSectionCategory = (sectionId) => {
    // Custom sections always use 'Other' category
    if (sectionId.startsWith('custom-')) {
      return 'Other';
    }
    
    const categoryMap = {
      'authority-notification': 'Regulations',
      'aml-cft-law': 'Guidelines', 
      'aml-cft-links': 'Templates',
      'gci-link': 'Policies',
      'outside-source': 'Other',
      'compliance-culture': 'Training'
    };
    return categoryMap[sectionId] || 'Other';
  };

  const handleUploadClick = (section) => {
    setSelectedSection(section);
    setUploadData({
      description: "",
      file: null,
      isLink: false,
      externalLink: "",
      tags: section.id
    });
    setShowUploadModal(true);
  };

  const handleFileUpload = async () => {
    if (!uploadData.description) {
      toast.error('Please fill in the description field');
      return;
    }
    
    if (!uploadData.isLink && !uploadData.file) {
      toast.error('Please select a file');
      return;
    }
    
    if (uploadData.isLink && !uploadData.externalLink) {
      toast.error('Please enter a link');
      return;
    }

    const currentSection = sections.find(s => s.id === selectedSection.id);
    
    if (currentSection.documents.length >= currentSection.maxDocuments) {
      toast.error(`Cannot upload. Maximum limit of ${currentSection.maxDocuments} documents has been reached.`);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Check if this is for Compliance Culture section
      if (selectedSection.id === 'compliance-culture') {
        // Use dedicated Compliance Culture API
        formData.append('title', uploadData.isLink ? 'Link Resource' : (uploadData.file ? uploadData.file.name : 'Resource'));
        formData.append('description', uploadData.description);
        formData.append('documentType', 'training');
        formData.append('category', 'Training Materials');
        formData.append('targetAudience', 'All Staff');
        formData.append('tags', 'compliance-culture,training');
        formData.append('version', '1.0');
        
        if (uploadData.isLink) {
          formData.append('externalLink', uploadData.externalLink);
        } else if (uploadData.file) {
          formData.append('file', uploadData.file);
        }
        
        console.log('Uploading to Compliance Culture backend...');
        await axios.post('/compliance-culture', formData);
      } else {
        // Use regular compliance resources API
        const title = uploadData.isLink ? 'Link Resource' : (uploadData.file ? uploadData.file.name : 'Resource');
        formData.append('title', title);
        formData.append('category', getSectionCategory(selectedSection.id));
        formData.append('description', uploadData.description);
        formData.append('tags', uploadData.tags);
        formData.append('version', '1.0');
        
        if (uploadData.isLink) {
          formData.append('externalLink', uploadData.externalLink);
        } else if (uploadData.file) {
          formData.append('file', uploadData.file);
        }
        
        console.log('Uploading resource to backend...');
        await axios.post('/compliance-resources', formData);
      }
      
      toast.success('Resource uploaded successfully');
      setShowUploadModal(false);
      setUploadData({
        description: "",
        file: null,
        isLink: false,
        externalLink: "",
        tags: ""
      });
      
      // Refresh resources
      fetchResources();
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
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
    
    setLoading(true);
    try {
      // Check if document is from Compliance Culture API
      if (selectedDocument.isFromCultureAPI) {
        await axios.delete(`/compliance-culture/${selectedDocument.id}`);
      } else {
        await axios.delete(`/compliance-resources/${selectedDocument.id}`);
      }
      
      toast.success('Resource deleted successfully');
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      setSelectedDocument(null);
      setSelectedSection(null);
      
      // Refresh resources
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocument = async (updatedData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Keep existing title or generate new one for file replacement
      let title = selectedDocument.name;
      if (updatedData.file) {
        title = updatedData.file.name;
      } else if (updatedData.externalLink && selectedDocument.isLink) {
        title = 'Link Resource';
      }
      
      formData.append('title', title);
      formData.append('description', updatedData.description);
      
      if (updatedData.externalLink) {
        formData.append('externalLink', updatedData.externalLink);
      }
      
      // Add file if replacing
      if (updatedData.file) {
        formData.append('file', updatedData.file);
        console.log('Replacing file with:', updatedData.file.name);
      }

      console.log('Updating resource:', selectedDocument.id);
      
      // Check if document is from Compliance Culture API
      if (selectedDocument.isFromCultureAPI) {
        // Add extra fields for compliance culture
        if (selectedDocument.documentType) formData.append('documentType', selectedDocument.documentType);
        if (selectedDocument.category) formData.append('category', selectedDocument.category);
        await axios.put(`/compliance-culture/${selectedDocument.id}`, formData);
      } else {
        await axios.put(`/compliance-resources/${selectedDocument.id}`, formData);
      }
      
      toast.success('Resource updated successfully');
      setShowEditModal(false);
      
      // Refresh resources
      fetchResources();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      // Check if document is from Compliance Culture API
      if (document.isFromCultureAPI) {
        await axios.get(`/compliance-culture/${document.id}/download`);
      } else {
        await axios.get(`/compliance-resources/${document.id}/download`);
      }
      
      if (document.fileUrl) {
        window.open(document.fileUrl, '_blank');
      } else if (document.link) {
        window.open(document.link, '_blank');
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast.error('Failed to download resource');
    }
  };

  const handleAddSection = async () => {
    if (!newSection.title) {
      toast.error('Please enter a section title');
      return;
    }

    setLoading(true);
    try {
      const colors = ["blue", "green", "purple", "orange", "red", "pink", "cyan", "yellow"];
      const randomColor = colors[sections.length % colors.length];

      // Save to backend first
      const sectionData = {
        maxDocuments: newSection.maxDocuments || 10,
        title: newSection.title,
        description: newSection.description || "Custom resource section"
      };

      console.log('Creating custom section in backend...');
      const response = await axios.post(`/section-settings`, sectionData);
      const createdSection = response.data.data;

      // Add to local state using the section ID from backend
      const newSectionObj = {
        id: createdSection.sectionId,
        title: createdSection.title,
        description: createdSection.description,
        icon: BookOpenIcon,
        color: createdSection.color || randomColor,
        documents: [],
        expanded: true,
        isCustom: true,
        maxDocuments: createdSection.maxDocuments,
      };

      setSections([...sections, newSectionObj]);
      setShowAddSectionModal(false);
      setNewSection({ title: "", description: "", maxDocuments: 10 });
      
      toast.success('Custom section added successfully');
    } catch (error) {
      console.error('Error adding custom section:', error);
      toast.error('Failed to add custom section: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (section) => {
    if (!section.isCustom) {
      toast.error('Cannot delete default sections');
      return;
    }
    
    if (section.documents.length > 0) {
      toast.error('Cannot delete section with resources. Please remove all resources first.');
      return;
    }
    
    setSelectedSection(section);
    setShowDeleteModal(true);
    setDeleteConfirmText("");
  };

  const confirmDeleteSection = async () => {
    if (deleteConfirmText !== selectedSection.title) {
      toast.error('Please type the section name correctly to confirm deletion');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Deleting custom section:', selectedSection.id);
      await axios.delete(`/section-settings/${selectedSection.id}`);
      
      // Remove from local state
      setSections(sections.filter(s => s.id !== selectedSection.id));
      
      setShowDeleteModal(false);
      setSelectedSection(null);
      setDeleteConfirmText("");
      
      toast.success(`${selectedSection.title} section deleted successfully`);
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSettings = (section) => {
    setSelectedSection({...section}); // Create a copy to avoid direct mutation
    setShowSectionSettingsModal(true);
  };

  const handleUpdateSectionSettings = async (newMaxDocuments) => {
    console.log('Updating section settings:', selectedSection.id, 'to max:', newMaxDocuments);
    
    setLoading(true);
    try {
      const updateData = {
        maxDocuments: newMaxDocuments,
        title: selectedSection.title,
        description: selectedSection.description
      };
      
      console.log('Sending section settings update to backend...');
      await axios.put(`/section-settings/${selectedSection.id}`, updateData);
      
      // Update local state
      setSections(sections.map(section =>
        section.id === selectedSection.id
          ? { ...section, maxDocuments: newMaxDocuments }
          : section
      ));
      
      setShowSectionSettingsModal(false);
      toast.success(`${selectedSection.title} settings updated successfully`);
    } catch (error) {
      console.error('Error updating section settings:', error);
      toast.error('Failed to update section settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleSectionExpand = (sectionId) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? { ...section, expanded: !section.expanded }
        : section
    ));
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
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Compliance Resources</h1>
                <p className="text-xs text-gray-500">Legal & Regulatory Documentation</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Compliance Resource Center</h2>
          <p className="text-gray-600">Access and manage regulatory compliance resources, laws, and external references</p>
        </motion.div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-600">Loading resources...</p>
          </div>
        )}

        {/* Document Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
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
                        <span>{section.documents.length} / {section.maxDocuments} resources</span>
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
                    disabled={section.documents.length >= section.maxDocuments || loading}
                    className={`flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all ${
                      section.documents.length >= section.maxDocuments || loading
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    <CloudArrowUpIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Add</span>
                  </motion.button>
                  {section.isCustom && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteSection(section)}
                      className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-all text-red-600 hover:bg-red-50"
                      title="Delete Section"
                      disabled={loading}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSectionExpand(section.id)}
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
                        key={document.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {document.isLink ? (
                                <LinkIcon className="w-5 h-5 text-blue-500" />
                              ) : (
                                <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                              )}
                              <span className="font-medium text-gray-800">
                                {document.isLink ? document.name : document.name}
                              </span>
                              {document.isImportant && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                  Important
                                </span>
                              )}
                              {document.isFromCultureAPI && document.documentType && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full capitalize">
                                  {document.documentType}
                                </span>
                              )}
                              {document.isLink && document.link && (
                                <a 
                                  href={document.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                                >
                                  Open Link
                                </a>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                            {document.isLink && document.link && (
                              <p className="text-xs text-blue-600 mt-1 truncate">{document.link}</p>
                            )}
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
                              {document.version && (
                                <span>v{document.version}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewDocument(document, section)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </motion.button>
                            {document.isLink ? (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => window.open(document.link, '_blank')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <LinkIcon className="w-5 h-5" />
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDownload(document)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <CloudArrowUpIcon className="w-5 h-5" />
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditDocument(document, section)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteClick(document, section)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={loading}
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
                  <p className="text-gray-500">No resources added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Add" to add your first resource or link</p>
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
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <FolderPlusIcon className="w-5 h-5" />
            <span>Add Custom Section</span>
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
                <h3 className="text-xl font-bold text-gray-800">Add Resource</h3>
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
                    Resource Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!uploadData.isLink}
                        onChange={() => setUploadData({ ...uploadData, isLink: false, externalLink: "" })}
                        className="mr-2"
                      />
                      <span className="text-sm">File Upload</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={uploadData.isLink}
                        onChange={() => setUploadData({ ...uploadData, isLink: true, file: null })}
                        className="mr-2"
                      />
                      <span className="text-sm">External Link</span>
                    </label>
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Description *
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    rows="3"
                    placeholder="Enter resource description..."
                  />
                </div>

                {uploadData.isLink ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      External Link *
                    </label>
                    <input
                      type="url"
                      value={uploadData.externalLink}
                      onChange={(e) => setUploadData({ ...uploadData, externalLink: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="https://example.com"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File *
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPEG, PNG (Max 50MB)
                    </p>
                  </div>
                )}

              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={loading || !uploadData.description || (!uploadData.isLink && !uploadData.file) || (uploadData.isLink && !uploadData.externalLink)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Add Resource'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Update Modal */}
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
                <h3 className="text-xl font-bold text-gray-800">Update Resource</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <EditResourceForm 
                document={selectedDocument} 
                onUpdate={handleUpdateDocument}
                onCancel={() => setShowEditModal(false)}
                loading={loading}
              />
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
                <h3 className="text-xl font-bold text-gray-800">Resource Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Resource Type</p>
                  <p className="font-medium text-gray-800">
                    {selectedDocument.isLink ? "External Link" : "File"}
                  </p>
                </div>

                {selectedDocument.isLink ? (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-1">Link URL</p>
                    <a 
                      href={selectedDocument.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-800 hover:text-blue-900 underline break-all"
                    >
                      {selectedDocument.link}
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">File Name</p>
                    <p className="font-medium text-gray-800">{selectedDocument.name}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="font-medium text-gray-800">{selectedDocument.description}</p>
                </div>

                {/* Show additional fields for Compliance Culture documents */}
                {selectedDocument.isFromCultureAPI && (
                  <>
                    {selectedDocument.documentType && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 mb-1">Document Type</p>
                        <p className="font-medium text-purple-800 capitalize">{selectedDocument.documentType}</p>
                      </div>
                    )}
                    
                    {selectedDocument.category && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 mb-1">Category</p>
                        <p className="font-medium text-green-800">{selectedDocument.category}</p>
                      </div>
                    )}
                    
                    {selectedDocument.targetAudience && selectedDocument.targetAudience.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 mb-1">Target Audience</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedDocument.targetAudience.map((audience, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              {audience}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedDocument.isImportant && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <p className="text-sm text-red-600 mb-1">⚠️ Important Document</p>
                        <p className="font-medium text-red-800">This document is marked as important</p>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Added Date</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Added Time</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedDocument.uploadDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Added By</p>
                    <p className="font-medium text-gray-800">{selectedDocument.uploadedBy}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Size</p>
                    <p className="font-medium text-gray-800">{selectedDocument.size}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Close
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
                  <p className="text-sm text-gray-500 mb-1">Current Resources</p>
                  <p className="font-medium text-gray-800">{selectedSection.documents.length} resources added</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Resources Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={selectedSection.maxDocuments}
                    onChange={(e) => setSelectedSection({ ...selectedSection, maxDocuments: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set the maximum number of resources that can be added (1-100)
                  </p>
                  {selectedSection.documents.length > selectedSection.maxDocuments && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Warning: Current resources exceed the new limit. Existing resources will be kept.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSectionSettingsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateSectionSettings(selectedSection.maxDocuments)}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Custom Section Modal */}
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
                <h3 className="text-xl font-bold text-gray-800">Add Custom Section</h3>
                <button
                  onClick={() => setShowAddSectionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter section title..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Description
                  </label>
                  <textarea
                    value={newSection.description}
                    onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    rows="3"
                    placeholder="Enter section description..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Resources Allowed *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newSection.maxDocuments}
                    onChange={(e) => setNewSection({ ...newSection, maxDocuments: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter maximum number of resources..."
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Set the maximum number of resources that can be added to this section (1-100)</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddSectionModal(false);
                    setNewSection({ title: "", description: "", maxDocuments: 10 });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSection}
                  disabled={loading || !newSection.title}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Add Section'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Section Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedSection && !selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmText("");
            }}
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
                    <h3 className="text-xl font-bold text-gray-800">Delete Custom Section</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-800">
                    You are about to delete the <span className="font-semibold">"{selectedSection.title}"</span> section.
                    This will permanently remove this custom section from your compliance resources.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-semibold text-red-600">"{selectedSection.title}"</span> to confirm deletion
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter section name to confirm"
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
                  onClick={confirmDeleteSection}
                  disabled={deleteConfirmText !== selectedSection.title || loading}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete Section'}
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
                    <h3 className="text-xl font-bold text-gray-800">Delete Resource</h3>
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
                    <strong>Resource to delete:</strong>
                  </p>
                  <p className="font-medium text-red-900">
                    {selectedDocument.name}
                  </p>
                  <p className="text-sm text-red-700 mt-1">{selectedDocument.description}</p>
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
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  disabled={deleteConfirmText !== "DELETE" || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    deleteConfirmText === "DELETE" && !loading
                      ? "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? 'Deleting...' : 'Delete Resource'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplianceResource;