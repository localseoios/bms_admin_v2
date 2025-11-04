import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import axios from '../../utils/axios';
import KYCSheet from './components/KYCSheet';
import BRASheet from './components/BRASheet';
import ScreeningRecords from './components/ScreeningRecords';
import OngoingMonitoring from './components/OngoingMonitoring';
import MoreSections from './components/MoreSections';
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
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const ComplianceClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [riskLevel, setRiskLevel] = useState('Medium');
  const [updatingRiskLevel, setUpdatingRiskLevel] = useState(false);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      
      // If ID looks like email, use directly; otherwise need to get email first
      let clientEmail = id;
      if (!id.includes('@')) {
        // First get the client list to find the email for this ID
        const clientsResponse = await axios.get(`/clients/compliance/all?limit=200`);
        const foundClient = clientsResponse.data.clients.find(c => c._id === id);
        if (foundClient) {
          clientEmail = foundClient.gmail;
        } else {
          throw new Error('Client not found');
        }
      }
      
      const response = await axios.get(`/clients/compliance/${encodeURIComponent(clientEmail)}`);
      
      // Transform backend response to match frontend expectations
      if (response.data && response.data.client) {
        const transformedClient = {
          _id: response.data.client._id,
          name: response.data.client.name,
          email: response.data.client.gmail,
          company: response.data.client.startingPoint || 'No Company',
          riskLevel: response.data.client.riskLevel || 'Medium',
          phone: 'N/A',
          address: 'N/A',
          jobCount: response.data.jobs ? response.data.jobs.length : 0,
          activeJobCount: response.data.jobs ? response.data.jobs.filter(job => !['completed', 'cancelled', 'rejected'].includes(job.status)).length : 0,
          // Add additional data for KYC
          jobs: response.data.jobs || [],
          engagementLetter: response.data.engagementLetter || [],
          documents: response.data.mostRecentDocuments || {},
          personDetailsDocuments: response.data.personDetailsDocuments || []
        };
        setClient(transformedClient);
        setRiskLevel(transformedClient.riskLevel || 'Medium');
      } else {
        throw new Error('Client data not available');
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      // Create placeholder client data for demo
      setClient({
        _id: id,
        name: 'Demo Client',
        email: 'demo@example.com',
        company: 'Demo Company',
        riskLevel: 'Medium',
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
        console.log('Risk level updated successfully');
      }
    } catch (error) {
      console.error('Error updating risk level:', error);
    } finally {
      setUpdatingRiskLevel(false);
    }
  };

  const tabs = [
    { name: 'KYC Sheet', icon: DocumentTextIcon, component: KYCSheet },
    { name: 'BRA Sheet', icon: DocumentTextIcon, component: BRASheet },
    { name: 'Screening Records', icon: ShieldCheckIcon, component: ScreeningRecords },
    { name: 'Ongoing Monitoring', icon: ChartBarIcon, component: OngoingMonitoring },
    { name: 'More Sections', icon: EllipsisHorizontalIcon, component: MoreSections }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => navigate('/compliance/clients')}
              className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium border border-white/30 hover:bg-opacity-30 mb-6"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Clients
            </button>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h1 className="text-4xl font-bold mb-4 flex items-center">
                  <UserCircleIcon className="h-12 w-12 mr-4" />
                  {client?.name || 'Client Name'}
                </h1>
                <div className="space-y-2">
                  <div className="flex items-center text-blue-100">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                    <span>{client?.company || 'No Company'}</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    <span>{client?.email || 'No Email'}</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    <span>{client?.phone || 'No Phone'}</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{client?.address || 'No Address'}</span>
                  </div>
                  <div className="flex items-center text-blue-100 mt-2">
                    <div className="flex items-center mr-2">
                      <div className={`h-5 w-5 rounded-full mr-2 ${
                        riskLevel === 'High' ? 'bg-red-400' :
                        riskLevel === 'Medium' ? 'bg-yellow-400' :
                        'bg-green-400'
                      }`}></div>
                    </div>
                    <div className="flex-1 flex items-center">
                      <span className="mr-3">Risk Level:</span>
                      <div className="relative">
                        <select
                          value={riskLevel}
                          onChange={(e) => updateRiskLevel(e.target.value)}
                          disabled={updatingRiskLevel}
                          className={`bg-transparent border-none text-blue-100 font-medium focus:outline-none cursor-pointer pr-6 ${
                            updatingRiskLevel ? 'opacity-50' : 'hover:text-white'
                          }`}
                          style={{ appearance: 'none' }}
                        >
                          <option value="Low" className="text-gray-900 bg-white">Low Risk</option>
                          <option value="Medium" className="text-gray-900 bg-white">Medium Risk</option>
                          <option value="High" className="text-gray-900 bg-white">High Risk</option>
                        </select>
                        <ChevronDownIcon className="h-4 w-4 absolute right-0 top-1/2 transform -translate-y-1/2 text-blue-100 pointer-events-none" />
                      </div>
                      {updatingRiskLevel && (
                        <span className="ml-2 text-sm">Updating...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4"
                  >
                    <p className="text-3xl font-bold">95%</p>
                    <p className="text-sm text-blue-100">KYC Complete</p>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4"
                  >
                    <p className="text-3xl font-bold">12</p>
                    <p className="text-sm text-blue-100">Screenings</p>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4"
                  >
                    <p className="text-3xl font-bold">Active</p>
                    <p className="text-sm text-blue-100">Status</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-2 bg-white rounded-xl shadow-lg p-2 mb-8">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    selected
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <tab.icon className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">{tab.name}</span>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {tabs.map((tab, index) => (
              <Tab.Panel key={index}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <tab.component client={client} />
                </motion.div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default ComplianceClientDetails;