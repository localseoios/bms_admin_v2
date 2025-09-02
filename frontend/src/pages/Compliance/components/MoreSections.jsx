import React, { useState } from 'react';
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

const MoreSections = ({ client }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    title: '',
    description: '',
    icon: 'DocumentDuplicateIcon',
    color: 'blue'
  });
  const [customSections, setCustomSections] = useState([]);
  const [sectionDocuments, setSectionDocuments] = useState({});

  const sections = [];

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
      gray: 'from-gray-400 to-gray-600 border-gray-300'
    };
    return colors[color] || colors.gray;
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

  const handleCreateNewSection = () => {
    if (newSectionData.title && newSectionData.description) {
      const newSection = {
        id: `custom-${Date.now()}`,
        title: newSectionData.title,
        description: newSectionData.description,
        icon: iconMap[newSectionData.icon] || DocumentDuplicateIcon,
        color: newSectionData.color,
        content: {
          notes: [],
          lastUpdated: new Date().toISOString().split('T')[0],
          verified: false
        },
        isCustom: true
      };
      
      setCustomSections([...customSections, newSection]);
      setSectionDocuments({
        ...sectionDocuments,
        [newSection.id]: []
      });
      
      setNewSectionData({
        title: '',
        description: '',
        icon: 'DocumentDuplicateIcon',
        color: 'blue'
      });
      setShowNewSectionModal(false);
    }
  };

  const handleDeleteCustomSection = (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setCustomSections(customSections.filter(section => section.id !== sectionId));
      const { [sectionId]: deleted, ...restDocuments } = sectionDocuments;
      setSectionDocuments(restDocuments);
    }
  };

  const handleFileUpload = (sectionId, e) => {
    const file = e.target.files[0];
    if (file) {
      const newDoc = {
        id: Date.now(),
        name: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        fileUrl: URL.createObjectURL(file),
        file: file
      };
      
      setSectionDocuments({
        ...sectionDocuments,
        [sectionId]: [...(sectionDocuments[sectionId] || []), newDoc]
      });
    }
  };

  const handleDeleteDocument = (sectionId, docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setSectionDocuments({
        ...sectionDocuments,
        [sectionId]: sectionDocuments[sectionId].filter(doc => doc.id !== docId)
      });
    }
  };

  const handleViewDocument = (doc) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      alert('Document preview not available');
    }
  };

  const handleDownloadDocument = (doc) => {
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.name;
      link.click();
    } else {
      alert('Document download not available');
    }
  };

  const allSections = [...sections, ...customSections];

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div
                onClick={() => toggleSection(section.id)}
                className={`cursor-pointer rounded-xl border-2 transition-all ${
                  expandedSection === section.id 
                    ? 'shadow-2xl transform scale-105' 
                    : 'hover:shadow-lg'
                }`}
              >
                <div className={`bg-gradient-to-r ${getColorClasses(section.color)} rounded-t-lg p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <section.icon className="h-6 w-6 mr-3" />
                      <h3 className="font-bold text-lg">{section.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {section.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomSection(section.id);
                          }}
                          className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                          title="Delete Section"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                      <motion.div
                        animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
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

                {expandedSection === section.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 rounded-b-lg"
                  >
                    {section.isCustom && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-800">Section Documents</h4>
                          <label className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center">
                            <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                            Upload
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(section.id, e)} 
                            />
                          </label>
                        </div>

                        {sectionDocuments[section.id] && sectionDocuments[section.id].length > 0 && (
                          <div className="space-y-2">
                            {sectionDocuments[section.id].map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center space-x-2">
                                  <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium">{doc.name}</p>
                                    <p className="text-xs text-gray-500">Uploaded: {doc.uploadDate}</p>
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
                                    onClick={() => handleDeleteDocument(section.id, doc.id)}
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

                        {(!sectionDocuments[section.id] || sectionDocuments[section.id].length === 0) && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No documents uploaded yet
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

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
                  {['blue', 'green', 'purple', 'red', 'orange', 'pink', 'indigo', 'gray'].map((color) => (
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
    </div>
  );
};

export default MoreSections;