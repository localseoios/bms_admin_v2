import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentDuplicateIcon,
  LightBulbIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  IdentificationIcon,
  CalendarIcon,
  FolderOpenIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  DocumentArrowDownIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import axios from '../../../utils/axios';

const PersonDetailsSheet = ({ client, personType = 'company' }) => {
  const [loading, setLoading] = useState(false);
  const [personDetails, setPersonDetails] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [expandedPerson, setExpandedPerson] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);

  const personTypeConfig = {
    company: {
      title: 'Company Details',
      subtitle: 'Corporate information and documents',
      icon: BuildingOfficeIcon,
      color: 'blue',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      bgGradient: 'from-blue-600 via-blue-500 to-indigo-500',
      iconBg: 'bg-blue-100'
    },
    director: {
      title: 'Directors',
      subtitle: 'Board members and their credentials',
      icon: UserIcon,
      color: 'indigo',
      lightBg: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-600',
      bgGradient: 'from-indigo-600 via-indigo-500 to-purple-500',
      iconBg: 'bg-indigo-100'
    },
    shareholder: {
      title: 'Shareholders',
      subtitle: 'Ownership structure and stakeholders',
      icon: BriefcaseIcon,
      color: 'purple',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      bgGradient: 'from-purple-600 via-purple-500 to-pink-500',
      iconBg: 'bg-purple-100'
    },
    secretary: {
      title: 'Company Secretary',
      subtitle: 'Administrative officers',
      icon: DocumentDuplicateIcon,
      color: 'cyan',
      lightBg: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-600',
      bgGradient: 'from-cyan-600 via-cyan-500 to-teal-500',
      iconBg: 'bg-cyan-100'
    },
    sef: {
      title: 'Senior Executive Functions',
      subtitle: 'Key management personnel',
      icon: LightBulbIcon,
      color: 'amber',
      lightBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-600',
      bgGradient: 'from-amber-500 via-orange-500 to-red-500',
      iconBg: 'bg-amber-100'
    }
  };

  const config = personTypeConfig[personType] || personTypeConfig.company;

  useEffect(() => {
    if (client?.jobs && client.jobs.length > 0) {
      fetchAllPersonDetails();
    }
  }, [client?.jobs, personType]);

  const fetchAllPersonDetails = async () => {
    if (!client?.jobs || client.jobs.length === 0) return;

    setLoading(true);
    try {
      const allDetails = [];

      for (const job of client.jobs) {
        try {
          if (personType === 'company') {
            const response = await axios.get(`/operations/jobs/${job._id}/company-details`);
            if (response.data) {
              allDetails.push({
                jobId: job._id,
                jobNumber: job.jobNumber,
                serviceType: job.serviceType,
                data: response.data
              });
            }
          } else {
            const response = await axios.get(`/operations/jobs/${job._id}/person-details/${personType}`);
            if (response.data && response.data.length > 0) {
              allDetails.push({
                jobId: job._id,
                jobNumber: job.jobNumber,
                serviceType: job.serviceType,
                persons: response.data
              });
            }
          }
        } catch (error) {
          console.log(`No ${personType} details for job ${job._id}`);
        }
      }

      if (personType === 'company') {
        setCompanyDetails(allDetails);
        if (allDetails.length > 0) {
          setExpandedJob(allDetails[0].jobId);
        }
      } else {
        setPersonDetails(allDetails);
        if (allDetails.length > 0 && allDetails[0].persons?.length > 0) {
          setExpandedPerson(allDetails[0].persons[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching person details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const DocumentCard = ({ label, url, fileName, icon: Icon = DocumentTextIcon }) => {
    if (!url) return null;

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300"
      >
        <div className="flex items-start space-x-3">
          <div className={`p-2.5 rounded-xl ${config.lightBg} group-hover:scale-110 transition-transform`}>
            <Icon className={`h-5 w-5 ${config.textColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">
              {fileName || 'Document'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleViewDocument(url)}
            className={`p-2.5 ${config.lightBg} ${config.textColor} rounded-xl hover:bg-opacity-80 transition-all shadow-sm`}
            title="View Document"
          >
            <EyeIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const InfoItem = ({ label, value, icon: Icon }) => {
    if (!value) return null;
    return (
      <div className="flex items-center space-x-3 py-2">
        {Icon && (
          <div className={`p-1.5 rounded-lg ${config.lightBg}`}>
            <Icon className={`h-4 w-4 ${config.textColor}`} />
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 font-medium">{label}</p>
          <p className="text-sm font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    );
  };

  const renderCompanyDetails = () => {
    if (!companyDetails || companyDetails.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className={`w-20 h-20 mx-auto rounded-2xl ${config.lightBg} flex items-center justify-center mb-4`}>
            <BuildingOfficeIcon className={`h-10 w-10 ${config.textColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Company Details</h3>
          <p className="text-gray-400 max-w-sm mx-auto">Company information will appear here once added to a job.</p>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        {companyDetails.map((jobData, index) => (
          <motion.div
            key={jobData.jobId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Company Header */}
            <button
              onClick={() => setExpandedJob(expandedJob === jobData.jobId ? null : jobData.jobId)}
              className={`w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r ${config.bgGradient} text-white`}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <BuildingOfficeIcon className="h-7 w-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">
                    {jobData.data.companyName || 'Company Details'}
                  </h3>
                  <p className="text-white/80 text-sm mt-0.5">
                    Job #{jobData.jobNumber || 'N/A'} • {jobData.serviceType || 'Service'}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedJob === jobData.jobId ? 180 : 0 }}
                className="p-2 bg-white/20 rounded-lg"
              >
                <ChevronDownIcon className="h-5 w-5 text-white" />
              </motion.div>
            </button>

            <AnimatePresence>
              {expandedJob === jobData.jobId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 space-y-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Company Info Card */}
                      <div className={`p-5 rounded-xl ${config.lightBg} border ${config.borderColor}`}>
                        <div className="flex items-center space-x-2 mb-4">
                          <IdentificationIcon className={`h-5 w-5 ${config.textColor}`} />
                          <h4 className="font-semibold text-gray-800">Registration Info</h4>
                        </div>
                        <div className="space-y-1">
                          <InfoItem label="Company Name" value={jobData.data.companyName} />
                          <InfoItem label="QFC Number" value={jobData.data.qfcNo} />
                          <InfoItem label="CR Number" value={jobData.data.crNo} />
                          <InfoItem label="License Type" value={jobData.data.licenseType} />
                        </div>
                      </div>

                      {/* Contact Card */}
                      <div className={`p-5 rounded-xl ${config.lightBg} border ${config.borderColor}`}>
                        <div className="flex items-center space-x-2 mb-4">
                          <MapPinIcon className={`h-5 w-5 ${config.textColor}`} />
                          <h4 className="font-semibold text-gray-800">Address</h4>
                        </div>
                        <div className="space-y-1">
                          <InfoItem label="Registered Address" value={jobData.data.registeredAddress} />
                          <InfoItem label="Business Address" value={jobData.data.businessAddress} />
                        </div>
                      </div>
                    </div>

                    {/* Documents Section */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <FolderOpenIcon className={`h-5 w-5 ${config.textColor}`} />
                        <h4 className="font-semibold text-gray-800">Company Documents</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DocumentCard label="Computer Card" url={jobData.data.companyComputerCard} fileName="Computer Card" icon={IdentificationIcon} />
                        <DocumentCard label="Tax Card" url={jobData.data.taxCard} fileName="Tax Card" icon={DocumentTextIcon} />
                        <DocumentCard label="Scope of License" url={jobData.data.scopeOfLicense} fileName="Scope of License" icon={CheckBadgeIcon} />
                        <DocumentCard label="Article of Association" url={jobData.data.articleOfAssociate} fileName="Article of Association" icon={DocumentTextIcon} />
                        <DocumentCard label="Certificate of Incorporation" url={jobData.data.certificateOfIncorporate} fileName="Certificate" icon={CheckBadgeIcon} />
                        {jobData.data.crExtract && Array.isArray(jobData.data.crExtract) && jobData.data.crExtract.map((doc, idx) => (
                          <DocumentCard key={`cr-${idx}`} label={`CR Extract ${idx + 1}`} url={doc.fileUrl || doc} fileName={`CR Extract ${idx + 1}`} icon={DocumentArrowDownIcon} />
                        ))}
                        {jobData.data.companyMemo && Array.isArray(jobData.data.companyMemo) && jobData.data.companyMemo.map((doc, idx) => (
                          <DocumentCard key={`memo-${idx}`} label={doc.fileName || `Other Document ${idx + 1}`} url={doc.fileUrl || doc} fileName={doc.fileName || `Document ${idx + 1}`} icon={FolderOpenIcon} />
                        ))}
                      </div>
                      {!jobData.data.companyComputerCard && !jobData.data.taxCard && !jobData.data.scopeOfLicense &&
                       !jobData.data.articleOfAssociate && !jobData.data.certificateOfIncorporate &&
                       (!jobData.data.crExtract || jobData.data.crExtract.length === 0) &&
                       (!jobData.data.companyMemo || jobData.data.companyMemo.length === 0) && (
                        <p className="text-center text-gray-400 py-8">No documents uploaded yet</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderPersonList = () => {
    if (!personDetails || personDetails.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className={`w-20 h-20 mx-auto rounded-2xl ${config.lightBg} flex items-center justify-center mb-4`}>
            <config.icon className={`h-10 w-10 ${config.textColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No {config.title}</h3>
          <p className="text-gray-400 max-w-sm mx-auto">{config.title} will appear here once added to a job.</p>
        </motion.div>
      );
    }

    // Flatten all persons from all jobs
    const allPersons = personDetails.flatMap(jobData =>
      jobData.persons.map(person => ({
        ...person,
        jobNumber: jobData.jobNumber,
        serviceType: jobData.serviceType,
        jobId: jobData.jobId
      }))
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allPersons.map((person, index) => (
          <motion.div
            key={person._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Person Header */}
            <button
              onClick={() => setExpandedPerson(expandedPerson === person._id ? null : person._id)}
              className={`w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r ${config.bgGradient}`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {person.name ? person.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">
                    {person.name || 'Unnamed'}
                  </h3>
                  <div className="flex items-center space-x-2 text-white/80 text-sm">
                    <GlobeAltIcon className="h-4 w-4" />
                    <span>{person.nationality || 'N/A'}</span>
                    {person.designation && (
                      <>
                        <span>•</span>
                        <span>{person.designation}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedPerson === person._id ? 180 : 0 }}
                className="p-2 bg-white/20 rounded-lg"
              >
                <ChevronDownIcon className="h-5 w-5 text-white" />
              </motion.div>
            </button>

            <AnimatePresence>
              {expandedPerson === person._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-5 space-y-5">
                    {/* Job Reference */}
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${config.lightBg} ${config.textColor} text-xs font-medium`}>
                      Job #{person.jobNumber} • {person.serviceType}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl ${config.lightBg} border ${config.borderColor}`}>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Personal Info</h5>
                        <div className="space-y-2">
                          <InfoItem icon={UserIcon} label="Full Name" value={person.name} />
                          <InfoItem icon={GlobeAltIcon} label="Nationality" value={person.nationality} />
                          <InfoItem icon={CalendarIcon} label="Date of Birth" value={person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString() : null} />
                          <InfoItem icon={EnvelopeIcon} label="Email" value={person.email} />
                          <InfoItem icon={PhoneIcon} label="Phone" value={person.mobileNo} />
                          <InfoItem icon={MapPinIcon} label="National Address" value={person.nationalAddress} />
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl ${config.lightBg} border ${config.borderColor}`}>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ID Information</h5>
                        <div className="space-y-2">
                          <InfoItem icon={IdentificationIcon} label="Passport No." value={person.passportNo} />
                          <InfoItem icon={CalendarIcon} label="Passport Expiry" value={person.passportExpiry ? new Date(person.passportExpiry).toLocaleDateString() : null} />
                          <InfoItem icon={IdentificationIcon} label="QID Number" value={person.qidNo} />
                          <InfoItem icon={CalendarIcon} label="QID Expiry" value={person.qidExpiry ? new Date(person.qidExpiry).toLocaleDateString() : null} />
                          {person.shareholdingPercentage && (
                            <InfoItem icon={BriefcaseIcon} label="Shareholding" value={`${person.shareholdingPercentage}%`} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                        <FolderOpenIcon className="h-4 w-4 mr-2" />
                        Documents
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DocumentCard label="Passport" url={person.passportDoc} fileName="Passport" icon={IdentificationIcon} />
                        <DocumentCard label="QID Document" url={person.qidDoc} fileName="QID" icon={IdentificationIcon} />
                        <DocumentCard label="National Address" url={person.nationalAddressDoc} fileName="National Address" icon={MapPinIcon} />
                        <DocumentCard label="CV / Resume" url={person.cv} fileName="CV" icon={DocumentTextIcon} />
                        {person.otherDocuments && Array.isArray(person.otherDocuments) && person.otherDocuments.map((doc, idx) => (
                          <DocumentCard
                            key={idx}
                            label={doc.fileName || `Other Document ${idx + 1}`}
                            url={doc.fileUrl}
                            fileName={doc.fileName || `Document ${idx + 1}`}
                            icon={FolderOpenIcon}
                          />
                        ))}
                      </div>
                      {!person.passportDoc && !person.qidDoc && !person.nationalAddressDoc && !person.cv &&
                       (!person.otherDocuments || person.otherDocuments.length === 0) && (
                        <p className="text-center text-gray-400 py-6 text-sm">No documents uploaded</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className={`w-16 h-16 rounded-2xl ${config.lightBg} flex items-center justify-center mb-4 animate-pulse`}>
          <config.icon className={`h-8 w-8 ${config.textColor}`} />
        </div>
        <div className="flex items-center space-x-3">
          <div className={`animate-spin rounded-full h-5 w-5 border-2 border-t-transparent ${config.borderColor}`}></div>
          <span className="text-gray-500 font-medium">Loading {config.title.toLowerCase()}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden bg-gradient-to-r ${config.bgGradient} rounded-2xl p-8 text-white shadow-xl`}
      >
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

        <div className="relative flex items-center space-x-5">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
            <config.icon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">{config.title}</h2>
            <p className="text-white/80 mt-1">{config.subtitle}</p>
            <div className="flex items-center mt-3 space-x-4">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {client?.name || 'Client'}
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center">
                <EyeIcon className="h-4 w-4 mr-1.5" />
                View Only
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        {personType === 'company' ? renderCompanyDetails() : renderPersonList()}
      </motion.div>
    </div>
  );
};

export default PersonDetailsSheet;
