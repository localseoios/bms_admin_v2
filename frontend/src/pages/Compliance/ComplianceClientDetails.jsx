import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import axios from '../../utils/axios';
import KYCSheet from './components/KYCSheet';
import BRASheet from './components/BRASheet';
import UBOSheet from './components/UBOSheet';
import CDDSheet from './components/CDDSheet';
import ScreeningRecords from './components/ScreeningRecords';
import OngoingMonitoring from './components/OngoingMonitoring';
import MoreSections from './components/MoreSections';
import PersonDetailsSheet from './components/PersonDetailsSheet';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChevronDownIcon,
  UserGroupIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentDuplicateIcon,
  LightBulbIcon,
  HomeIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  IdentificationIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useAuth } from '../../context/AuthContext';

const ComplianceClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [localUser, setLocalUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [riskLevel, setRiskLevel] = useState('Pending');
  const [updatingRiskLevel, setUpdatingRiskLevel] = useState(false);
  const [primaryDirector, setPrimaryDirector] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setLocalUser(JSON.parse(storedUser));
    }
    setAuthChecked(true);
  }, []);

  const currentUser = user || localUser;

  useEffect(() => {
    if (authChecked && !currentUser) {
      navigate('/login');
    }
  }, [authChecked, currentUser, navigate]);

  useEffect(() => {
    if (authChecked && currentUser) {
      fetchClientDetails();
    }
  }, [id, authChecked, currentUser]);

  useEffect(() => {
    const fetchDirectorAndCompanyDetails = async () => {
      if (client?.jobs && client.jobs.length > 0) {
        const mostRecentJob = client.jobs[0];
        try {
          const [directorRes, companyRes] = await Promise.all([
            axios.get(`/operations/jobs/${mostRecentJob._id}/person-details/director`),
            axios.get(`/operations/jobs/${mostRecentJob._id}/company-details`)
          ]);
          if (directorRes.data && directorRes.data.length > 0) {
            setPrimaryDirector(directorRes.data[0]);
          }
          if (companyRes.data) {
            setCompanyDetails(companyRes.data);
          }
        } catch (error) {
          console.log('Error fetching details:', error.message);
        }
      }
    };
    fetchDirectorAndCompanyDetails();
  }, [client?.jobs]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);

      let clientEmail = id;
      if (!id.includes('@')) {
        const clientsResponse = await axios.get(`/clients/compliance/all?limit=200`);
        const foundClient = clientsResponse.data.clients.find(c => c._id === id);
        if (foundClient) {
          clientEmail = foundClient.gmail;
        } else {
          throw new Error('Client not found');
        }
      }

      const response = await axios.get(`/clients/compliance/${encodeURIComponent(clientEmail)}`);

      if (response.data && response.data.client) {
        const transformedClient = {
          _id: response.data.client._id,
          name: response.data.client.name,
          email: response.data.client.gmail,
          company: response.data.client.startingPoint || 'No Company',
          startingPoint: response.data.client.startingPoint || '',
          crNo: response.data.client.crNo || '',
          riskLevel: response.data.client.riskLevel || 'Pending',
          phone: response.data.client.phone || response.data.client.contactNumber || 'N/A',
          address: response.data.client.address || 'N/A',
          jobCount: response.data.jobs ? response.data.jobs.length : 0,
          activeJobCount: response.data.jobs ? response.data.jobs.filter(job => !['completed', 'cancelled', 'rejected'].includes(job.status)).length : 0,
          jobs: response.data.jobs || [],
          engagementLetter: response.data.engagementLetter || [],
          documents: response.data.mostRecentDocuments || {},
          personDetailsDocuments: response.data.personDetailsDocuments || []
        };
        setClient(transformedClient);
        setRiskLevel(transformedClient.riskLevel || 'Pending');
      } else {
        throw new Error('Client data not available');
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      setClient({
        _id: id,
        name: 'Demo Client',
        email: 'demo@example.com',
        company: 'Demo Company',
        riskLevel: 'Pending',
        phone: 'N/A',
        address: 'N/A',
        jobCount: 0,
        activeJobCount: 0,
        jobs: [],
        engagementLetter: [],
        documents: {},
        personDetailsDocuments: []
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRiskLevel = async (newRiskLevel) => {
    if (!client) return;

    try {
      setUpdatingRiskLevel(true);

      let clientEmail = client.email;
      if (!clientEmail && id.includes('@')) {
        clientEmail = id;
      }

      const response = await axios.put(`/clients/${encodeURIComponent(clientEmail)}/risk-level`, {
        riskLevel: newRiskLevel
      });

      if (response.data.success !== false) {
        setRiskLevel(newRiskLevel);
        setClient(prev => ({ ...prev, riskLevel: newRiskLevel }));
      }
    } catch (error) {
      console.error('Error updating risk level:', error);
    } finally {
      setUpdatingRiskLevel(false);
    }
  };

  const CompanySheet = (props) => <PersonDetailsSheet {...props} personType="company" />;
  const DirectorSheet = (props) => <PersonDetailsSheet {...props} personType="director" />;
  const ShareholderSheet = (props) => <PersonDetailsSheet {...props} personType="shareholder" />;
  const SecretarySheet = (props) => <PersonDetailsSheet {...props} personType="secretary" />;
  const SEFSheet = (props) => <PersonDetailsSheet {...props} personType="sef" />;

  const tabs = [
    { name: 'Company', icon: BuildingOfficeIcon, component: CompanySheet, color: 'from-blue-500 to-indigo-600' },
    { name: 'Directors', icon: UserIcon, component: DirectorSheet, color: 'from-purple-500 to-violet-600' },
    { name: 'Shareholders', icon: BriefcaseIcon, component: ShareholderSheet, color: 'from-emerald-500 to-green-600' },
    { name: 'Secretary', icon: DocumentDuplicateIcon, component: SecretarySheet, color: 'from-amber-500 to-orange-600' },
    { name: 'SEF', icon: LightBulbIcon, component: SEFSheet, color: 'from-pink-500 to-rose-600' },
    { name: 'KYC Sheet', icon: DocumentTextIcon, component: KYCSheet, color: 'from-cyan-500 to-blue-600' },
    { name: 'BRA Sheet', icon: DocumentTextIcon, component: BRASheet, color: 'from-red-500 to-pink-600' },
    { name: 'UBO', icon: UserGroupIcon, component: UBOSheet, color: 'from-indigo-500 to-purple-600' },
    { name: 'CDD', icon: ShieldCheckIcon, component: CDDSheet, color: 'from-teal-500 to-emerald-600' },
    { name: 'Screening', icon: ShieldCheckIcon, component: ScreeningRecords, color: 'from-orange-500 to-red-600' },
    { name: 'Monitoring', icon: ChartBarIcon, component: OngoingMonitoring, color: 'from-violet-500 to-indigo-600' },
    { name: 'More', icon: EllipsisHorizontalIcon, component: MoreSections, color: 'from-gray-500 to-slate-600' }
  ];

  const getRiskColor = (level) => {
    switch (level) {
      case 'High': return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' };
      case 'Medium': return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' };
      case 'Low': return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' };
      default: return { bg: 'bg-gray-400', text: 'text-gray-600', light: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const riskColors = getRiskColor(riskLevel);

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-purple-200 font-medium"
          >
            Loading client details...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/compliance/clients')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all duration-200 shadow-sm"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Back</span>
              </motion.button>

              <div className="hidden sm:block h-6 w-px bg-gray-300" />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/compliance-selection')}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Compliance Hub</span>
              </motion.button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Compliance Portal
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <HomeIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Dashboard</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTE4IDBjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Client Info Card */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
              >
                <div className="flex items-start space-x-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <BuildingOfficeIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {companyDetails?.companyName || client?.name || 'N/A'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {companyDetails?.qfcNo && (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white/90 font-medium">
                          QFC: {companyDetails.qfcNo}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        riskLevel === 'High' ? 'bg-red-500/80 text-white' :
                        riskLevel === 'Medium' ? 'bg-amber-500/80 text-white' :
                        riskLevel === 'Low' ? 'bg-emerald-500/80 text-white' :
                        'bg-gray-400/80 text-white'
                      }`}>
                        {riskLevel} Risk
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mt-6">
                      <div className="flex items-center space-x-3 text-white/80">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                          <EnvelopeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Email</p>
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {client?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-white/80">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                          <PhoneIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Phone</p>
                          <p className="text-sm font-medium">{client?.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-white/80 sm:col-span-2">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                          <MapPinIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Address</p>
                          <p className="text-sm font-medium">
                            {client?.address || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Risk Level Card */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl h-full"
              >
                <h3 className="text-white/80 text-sm font-medium mb-4 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  Risk Assessment
                </h3>

                <div className="space-y-4">
                  <div className={`w-full h-3 rounded-full bg-white/20 overflow-hidden`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: riskLevel === 'High' ? '100%' :
                               riskLevel === 'Medium' ? '66%' :
                               riskLevel === 'Low' ? '33%' : '10%'
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${
                        riskLevel === 'High' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                        riskLevel === 'Medium' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                        riskLevel === 'Low' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                        'bg-gradient-to-r from-gray-400 to-gray-600'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-white/60 text-xs mb-2">Update Risk Level</label>
                    <div className="relative">
                      <select
                        value={riskLevel}
                        onChange={(e) => updateRiskLevel(e.target.value)}
                        disabled={updatingRiskLevel}
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                      >
                        <option value="Pending" className="text-gray-900">Pending</option>
                        <option value="Low" className="text-gray-900">Low Risk</option>
                        <option value="Medium" className="text-gray-900">Medium Risk</option>
                        <option value="High" className="text-gray-900">High Risk</option>
                      </select>
                      <ChevronDownIcon className="w-5 h-5 text-white/60 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>
                    {updatingRiskLevel && (
                      <p className="text-white/60 text-xs mt-2 flex items-center">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-3 h-3 border-2 border-white/40 border-t-transparent rounded-full mr-2"
                        />
                        Updating...
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white">{client?.jobCount || 0}</p>
                        <p className="text-xs text-white/60">Total Jobs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-400">{client?.activeJobCount || 0}</p>
                        <p className="text-xs text-white/60">Active Jobs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          {/* Tab List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tab.List className="flex overflow-x-auto scrollbar-hide space-x-2 bg-white rounded-2xl shadow-xl p-2 border border-gray-100">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap focus:outline-none ${
                      selected
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-[1.02]`
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-sm">{tab.name}</span>
                </Tab>
              ))}
            </Tab.List>
          </motion.div>

          {/* Tab Panels */}
          <Tab.Panels className="mt-6 pb-12">
            {tabs.map((tab, index) => (
              <Tab.Panel key={index}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className={`h-1 bg-gradient-to-r ${tab.color}`} />
                    <div className="p-6">
                      <tab.component client={client} />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ComplianceClientDetails;
