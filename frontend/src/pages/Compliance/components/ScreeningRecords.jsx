import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  UserGroupIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import axios from '../../../utils/axios';

const ScreeningRecords = ({ client }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [screeningRecords, setScreeningRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, clear: 0, review: 0, alert: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch screening records from backend API
  useEffect(() => {
    const fetchScreeningRecords = async () => {
      if (client?.email) {
        setLoading(true);
        try {
          console.log('Fetching screening records for client:', client.email);
          const response = await axios.get(`/screening/compliance/client/${encodeURIComponent(client.email)}`);
          console.log('Screening API response:', response.data);
          
          if (response.data && response.data.screenings) {
            // Transform backend data to match frontend expectations
            const transformedRecords = response.data.screenings.map(screening => ({
              id: screening._id,
              type: screening.screeningType,
              date: screening.createdAt ? screening.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              result: screening.result,
              details: screening.details,
              screenedBy: screening.screenedBy?.name || 'System',
              sources: screening.dataSources?.map(ds => ds.name) || [],
              jobNumber: screening.jobId?.jobNumber || 'Unknown',
              jobId: screening.jobId?._id,
              riskScore: screening.riskScore,
              findings: screening.findings || [],
              reviewNotes: screening.reviewNotes
            }));
            
            setScreeningRecords(transformedRecords);
            setSummary(response.data.summary || { total: 0, clear: 0, review: 0, alert: 0, pending: 0 });
          }
        } catch (error) {
          console.error('Error fetching screening records:', error);
          // Fallback to empty state
          setScreeningRecords([]);
          setSummary({ total: 0, clear: 0, review: 0, alert: 0, pending: 0 });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchScreeningRecords();
  }, [client]);

  const screeningTypes = [
    { name: 'PEP Check', icon: UserGroupIcon, color: 'blue' },
    { name: 'Sanctions', icon: ShieldCheckIcon, color: 'purple' },
    { name: 'Adverse Media', icon: GlobeAltIcon, color: 'orange' },
    { name: 'Criminal Records', icon: ExclamationTriangleIcon, color: 'red' },
    { name: 'Financial Crime', icon: DocumentMagnifyingGlassIcon, color: 'yellow' }
  ];

  const getResultBadge = (result) => {
    switch (result) {
      case 'clear':
        return (
          <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            <CheckBadgeIcon className="h-4 w-4 mr-1" />
            Clear
          </span>
        );
      case 'review':
        return (
          <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
            Review Required
          </span>
        );
      case 'alert':
        return (
          <span className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Alert
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRecords = screeningRecords.filter(record => {
    const matchesFilter = activeFilter === 'all' || record.result === activeFilter;
    const matchesSearch = record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });


  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <ShieldCheckIcon className="h-8 w-8 mr-3 text-purple-600" />
            Screening Records
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {screeningTypes.map((type, index) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br from-${type.color}-50 to-${type.color}-100 rounded-xl p-4 text-center border border-${type.color}-200`}
            >
              <type.icon className={`h-8 w-8 mx-auto mb-2 text-${type.color}-600`} />
              <p className="text-sm font-semibold text-gray-700">{type.name}</p>
              <p className="text-xs text-gray-500 mt-1">Last: Today</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search screening records..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'clear', 'review', 'alert'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading screening records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No screening records found</p>
            </div>
          ) : filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-xl p-5 hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{record.type}</h3>
                    {record.jobNumber && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        Job: {record.jobNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{record.details}</p>
                </div>
                {getResultBadge(record.result)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Date: {record.date}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>By: {record.screenedBy}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <GlobeAltIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Sources: {record.sources.length}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Data Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {record.sources.map((source, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                      {source}
                    </span>
                  ))}
                </div>
              </div>

            </motion.div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Screening Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{summary.total}</p>
              <p className="text-sm text-gray-600">Total Screenings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{summary.clear}</p>
              <p className="text-sm text-gray-600">Clear Results</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{summary.review}</p>
              <p className="text-sm text-gray-600">Under Review</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{summary.alert}</p>
              <p className="text-sm text-gray-600">Alerts</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScreeningRecords;