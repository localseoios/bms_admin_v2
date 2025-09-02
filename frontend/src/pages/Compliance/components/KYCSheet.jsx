import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  PaperClipIcon,
  CalendarIcon,
  UserIcon,
  IdentificationIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import axios from '../../../utils/axios';

const KYCSheet = ({ client }) => {
  const [activeSection, setActiveSection] = useState('personal');
  const [kycApprovals, setKycApprovals] = useState([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  
  // Fetch KYC approval documents for all jobs
  useEffect(() => {
    const fetchKycDocuments = async () => {
      if (client?.jobs && Array.isArray(client.jobs)) {
        setLoadingKyc(true);
        const approvals = [];
        
        console.log('Fetching KYC documents for jobs:', client.jobs.map(j => ({ id: j._id, number: j.jobNumber })));
        
        for (const job of client.jobs) {
          try {
            console.log(`Fetching KYC for job ${job._id}...`);
            const response = await axios.get(`/kyc/compliance/jobs/${job._id}/status`);
            console.log(`KYC response for job ${job._id}:`, response.data);
            
            if (response.data) {
              approvals.push({
                jobId: job._id,
                jobNumber: job.jobNumber,
                kycApproval: response.data
              });
            }
          } catch (error) {
            console.log(`No KYC approval found for job ${job._id}:`, error.message);
          }
        }
        
        console.log('Total KYC approvals found:', approvals);
        setKycApprovals(approvals);
        setLoadingKyc(false);
      }
    };
    
    fetchKycDocuments();
  }, [client]);
  
  // Initialize documents with actual client data if available
  const initializeDocuments = () => {
    const clientDocuments = [];
    let docId = 1;

    // Add KYC approval documents
    console.log('Processing KYC approvals:', kycApprovals);
    kycApprovals.forEach(approval => {
      const kyc = approval.kycApproval;
      console.log('Processing KYC approval:', kyc);
      
      // Add LMRO document if exists
      if (kyc.lmroApproval?.document?.fileUrl) {
        console.log('Found LMRO document:', kyc.lmroApproval.document);
        clientDocuments.push({
          id: docId++,
          name: kyc.lmroApproval.document.fileName || 'LMRO KYC Document',
          status: 'verified',
          uploadDate: kyc.lmroApproval.document.uploadedAt ? new Date(kyc.lmroApproval.document.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          verifiedBy: kyc.lmroApproval.approvedBy?.name || 'LMRO',
          type: 'kyc',
          url: kyc.lmroApproval.document.fileUrl,
          jobNumber: approval.jobNumber,
          stage: 'LMRO Approval'
        });
      }
      
      // Add DLMRO document if exists
      if (kyc.dlmroApproval?.document?.fileUrl) {
        console.log('Found DLMRO document:', kyc.dlmroApproval.document);
        clientDocuments.push({
          id: docId++,
          name: kyc.dlmroApproval.document.fileName || 'DLMRO KYC Document',
          status: 'verified',
          uploadDate: kyc.dlmroApproval.document.uploadedAt ? new Date(kyc.dlmroApproval.document.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          verifiedBy: kyc.dlmroApproval.approvedBy?.name || 'DLMRO',
          type: 'kyc',
          url: kyc.dlmroApproval.document.fileUrl,
          jobNumber: approval.jobNumber,
          stage: 'DLMRO Approval'
        });
      }
      
      // Add CEO document if exists
      if (kyc.ceoApproval?.document?.fileUrl) {
        console.log('Found CEO document:', kyc.ceoApproval.document);
        clientDocuments.push({
          id: docId++,
          name: kyc.ceoApproval.document.fileName || 'CEO KYC Document',
          status: 'verified',
          uploadDate: kyc.ceoApproval.document.uploadedAt ? new Date(kyc.ceoApproval.document.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          verifiedBy: kyc.ceoApproval.approvedBy?.name || 'CEO',
          type: 'kyc',
          url: kyc.ceoApproval.document.fileUrl,
          jobNumber: approval.jobNumber,
          stage: 'CEO Approval'
        });
      }
    });

    // Always return actual documents only, no demo data
    console.log('KYC Documents found:', clientDocuments.length);

    return clientDocuments;
  };

  const [documents, setDocuments] = useState([]);

  // Update documents when client data or KYC approvals change
  useEffect(() => {
    if (!loadingKyc) {
      setDocuments(initializeDocuments());
    }
  }, [client, kycApprovals, loadingKyc]);

  const kycSections = [
    { id: 'personal', name: 'Personal Information', icon: UserIcon, progress: 100 },
    { id: 'identification', name: 'Identification', icon: IdentificationIcon, progress: 90 },
    { id: 'financial', name: 'Financial Information', icon: BanknotesIcon, progress: 75 },
    { id: 'business', name: 'Business Details', icon: BuildingLibraryIcon, progress: 60 }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };


  const handleViewDocument = (doc) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else if (doc.url) {
      window.open(doc.url, '_blank');
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
    } else if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.click();
    } else {
      alert('Document download not available');
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
          <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
          KYC Verification Sheet
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {kycSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActiveSection(section.id)}
              className={`cursor-pointer rounded-xl p-4 transition-all ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <section.icon className={`h-8 w-8 mb-2 ${activeSection === section.id ? 'text-white' : 'text-gray-600'}`} />
              <h3 className={`font-semibold text-sm ${activeSection === section.id ? 'text-white' : 'text-gray-800'}`}>
                {section.name}
              </h3>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      activeSection === section.id ? 'bg-white' : 'bg-blue-600'
                    }`}
                    style={{ width: `${section.progress}%` }}
                  ></div>
                </div>
                <p className={`text-xs mt-1 ${activeSection === section.id ? 'text-blue-100' : 'text-gray-600'}`}>
                  {section.progress}% Complete
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Client Information</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Full Name:</span>
                <span className="font-medium">{client?.name || 'John Doe'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date of Birth:</span>
                <span className="font-medium">1985-06-15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nationality:</span>
                <span className="font-medium">British</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID Number:</span>
                <span className="font-medium">AB123456789</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Level:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Low Risk</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Verification Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Identity Verification</span>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Address Verification</span>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Source of Funds</span>
                  <ClockIcon className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">KYC Documents</h3>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <PaperClipIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800">{doc.name}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {doc.uploadDate}
                          </span>
                          {doc.verifiedBy && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <UserIcon className="h-3 w-3 mr-1" />
                              {doc.verifiedBy}
                            </span>
                          )}
                          {doc.jobNumber && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Job: {doc.jobNumber}
                            </span>
                          )}
                          {doc.stage && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              {doc.stage}
                            </span>
                          )}
                        </div>
                        {doc.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {doc.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="View Document"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                          title="Download Document"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(doc.status)}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      {getStatusIcon(doc.status)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default KYCSheet;