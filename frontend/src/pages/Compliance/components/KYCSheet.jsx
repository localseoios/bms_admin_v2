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
  ArrowDownTrayIcon,
  ChevronDownIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  LockClosedIcon,
  CheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import axios from '../../../utils/axios';

const KYCSheet = ({ client }) => {
  const [activeSection, setActiveSection] = useState('personal');
  const [kycApprovals, setKycApprovals] = useState([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [riskLevel, setRiskLevel] = useState(client?.riskLevel || 'Medium');
  const [updatingRiskLevel, setUpdatingRiskLevel] = useState(false);

  // Update risk level when client changes
  useEffect(() => {
    if (client?.riskLevel) {
      setRiskLevel(client.riskLevel);
    }
  }, [client?.riskLevel]);

  const updateRiskLevel = async (newRiskLevel) => {
    if (!client) return;

    try {
      setUpdatingRiskLevel(true);
      const clientEmail = client.email;

      const response = await axios.put(`/clients/${encodeURIComponent(clientEmail)}/risk-level`, {
        riskLevel: newRiskLevel
      });

      if (response.data.success !== false) {
        setRiskLevel(newRiskLevel);
        console.log('Risk level updated successfully');
      }
    } catch (error) {
      console.error('Error updating risk level:', error);
    } finally {
      setUpdatingRiskLevel(false);
    }
  };

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

  const getStageDisplayName = (stage) => {
    const stageNames = {
      lmro: "LMRO",
      dlmro: "DLMRO",
      ceo: "CEO",
    };
    return stageNames[stage] || stage.toUpperCase();
  };

  const renderKycDocumentSection = (kycData, jobId) => {
    if (!kycData) return null;

    const documents = [];

    const createDocumentInfo = (stage, approval) => {
      if (!approval?.document?.fileUrl) return null;

      return {
        stage,
        stageLabel: getStageDisplayName(stage),
        document: approval.document,
        approval: approval,
      };
    };

    if (kycData.lmroApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("lmro", kycData.lmroApproval));
    }

    if (kycData.dlmroApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("dlmro", kycData.dlmroApproval));
    }

    if (kycData.ceoApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("ceo", kycData.ceoApproval));
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
          <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No KYC documents have been uploaded yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((doc) => {
          const stageColors = {
            lmro: {
              bg: "bg-blue-50",
              border: "border-blue-200",
              text: "text-blue-800",
              icon: "text-blue-600",
            },
            dlmro: {
              bg: "bg-purple-50",
              border: "border-purple-200",
              text: "text-purple-800",
              icon: "text-purple-600",
            },
            ceo: {
              bg: "bg-indigo-50",
              border: "border-indigo-200",
              text: "text-indigo-800",
              icon: "text-indigo-600",
            },
          };
          const colors = stageColors[doc.stage];

          return (
            <div
              key={doc.stage}
              className={`group relative ${colors.bg} rounded-lg p-4 transition-all duration-200 hover:shadow-md ${colors.border}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="flex-shrink-0">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-md bg-white ${colors.icon} shadow-sm`}
                    >
                      {doc.stage === "lmro" && (
                        <UserGroupIcon className="h-5 w-5" />
                      )}
                      {doc.stage === "dlmro" && (
                        <ClipboardDocumentCheckIcon className="h-5 w-5" />
                      )}
                      {doc.stage === "ceo" && (
                        <LockClosedIcon className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h6 className={`text-sm font-medium ${colors.text}`}>
                      {doc.stageLabel} Document
                    </h6>
                    <p className={`mt-1 text-xs flex items-center flex-wrap gap-2`}>
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                        {doc.document.fileName || "Document"}
                      </span>
                      <span className="mx-1">•</span>
                      {doc.approval.approved ? (
                        <span className="inline-flex items-center text-green-700">
                          <CheckIcon className="h-3 w-3 mr-0.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-700">
                          <ClockIcon className="h-3 w-3 mr-0.5" /> Pending
                        </span>
                      )}
                    </p>

                    <div className="mt-2 space-y-1">
                      {doc.document.uploadedBy && (
                        <p className="text-xs text-gray-600">
                          <UserIcon className="h-3 w-3 inline mr-1" />
                          Uploaded by:{" "}
                          <span className="font-medium">
                            {doc.document.uploadedBy.name || "Unknown User"}
                          </span>
                        </p>
                      )}
                      {doc.document.uploadedAt && (
                        <p className="text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          Uploaded:{" "}
                          {new Date(doc.document.uploadedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={doc.document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center text-xs ${colors.icon} hover:opacity-80 bg-white rounded-md px-2 py-1 ${colors.border} hover:shadow-sm transition-all`}
                      >
                        <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Risk Level:</span>
                <div className="relative">
                  <select
                    value={riskLevel}
                    onChange={(e) => updateRiskLevel(e.target.value)}
                    disabled={updatingRiskLevel}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border-none outline-none cursor-pointer pr-6 ${
                      riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                      riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    } ${updatingRiskLevel ? 'opacity-50' : ''}`}
                    style={{ appearance: 'none' }}
                  >
                    <option value="Low" className="bg-white text-gray-900">Low Risk</option>
                    <option value="Medium" className="bg-white text-gray-900">Medium Risk</option>
                    <option value="High" className="bg-white text-gray-900">High Risk</option>
                  </select>
                  <ChevronDownIcon className="h-3 w-3 absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" />
                </div>
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
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                KYC Documents
              </h3>
            </div>

            <div className="space-y-4">
              {kycApprovals.length > 0 ? (
                kycApprovals.map((approval) => (
                  <div key={approval.jobId} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Job: {approval.jobNumber || approval.jobId}
                    </h4>
                    {renderKycDocumentSection(approval.kycApproval, approval.jobId)}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {loadingKyc ? 'Loading KYC documents...' : 'No KYC documents found for this client.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default KYCSheet;