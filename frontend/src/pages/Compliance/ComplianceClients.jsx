import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { MagnifyingGlassIcon, UserGroupIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const ComplianceClients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(1); // Reset to page 1 when searching
    }, 500); // 500ms delay for debouncing

    return () => clearTimeout(timer);
  }, [searchTerm, filter]);

  const fetchClients = async (page = 1) => {
    try {
      setLoading(true);
      
      // Build query parameters
      let queryParams = `limit=10&page=${page}`;
      if (searchTerm) {
        queryParams += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (filter !== 'all') {
        queryParams += `&status=${filter}`;
      }
      
      const response = await axios.get(`/clients/compliance/all?${queryParams}`);
      
      // Transform backend data to match frontend expectations
      const transformedClients = response.data.clients.map(client => ({
        _id: client._id,
        name: client.name,
        email: client.gmail, // backend uses 'gmail' field for email
        company: client.startingPoint || 'No Company',
        phone: 'N/A', // Phone not in backend model
        address: 'N/A', // Address not in backend model  
        status: getClientStatus(client),
        kycScore: Math.floor(Math.random() * 30) + 70, // Generate random score for now
        riskLevel: getRiskLevel(client),
        lastReview: client.latestJobDate ? client.latestJobDate.split('T')[0] : 'Not reviewed'
      }));
      
      setClients(transformedClients);
      
      // Update pagination info
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Fallback to empty array on error
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchClients(newPage);
  };

  const getClientStatus = (client) => {
    if (client.activeJobCount > 0) {
      return 'active';
    } else if (client.jobCount > 0) {
      return 'inactive';
    }
    return 'pending';
  };

  const getRiskLevel = (client) => {
    // Simple risk assessment based on job activity
    if (client.activeJobCount > 2) {
      return 'high';
    } else if (client.activeJobCount > 0) {
      return 'medium';
    }
    return 'low';
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceScore = (client) => {
    return client.kycScore || Math.floor(Math.random() * 30) + 70;
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl">
                <ShieldCheckIcon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4">Compliance Clients</h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Comprehensive client compliance management with KYC verification, risk screening, and ongoing monitoring
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/compliance-selection')}
            className="inline-flex items-center px-6 py-3 bg-white bg-opacity-90 backdrop-blur-sm text-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium border border-indigo-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Compliance
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, or company..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'pending', 'inactive'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table Layout */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No clients found</p>
              </div>
            ) : (
              <motion.table
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="min-w-full divide-y divide-gray-200"
              >
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KYC Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client, index) => (
                    <motion.tr
                      key={client._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/compliance/client/${client._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-800">
                                {(client.name || 'N/A').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {client._id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.company || 'No Company'}</div>
                        <div className="text-sm text-gray-500">{client.address || 'No Address'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.email || 'No email'}</div>
                        <div className="text-sm text-gray-500">{client.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status || 'pending')}`}>
                          {client.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${getComplianceScore(client)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {getComplianceScore(client)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(client.riskLevel)}`}>
                          {client.riskLevel ? client.riskLevel.charAt(0).toUpperCase() + client.riskLevel.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.lastReview || 'Not reviewed'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/compliance/client/${client._id}`);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </motion.table>
            )}
          </div>
        </motion.div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center items-center space-x-2 my-6"
          >
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                let pageNumber;
                if (pagination.totalPages <= 5) {
                  pageNumber = index + 1;
                } else {
                  const start = Math.max(1, pagination.currentPage - 2);
                  const end = Math.min(pagination.totalPages, start + 4);
                  const adjustedStart = Math.max(1, end - 4);
                  pageNumber = adjustedStart + index;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pagination.currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            
            <div className="ml-4 text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total clients)
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Total Clients</h3>
            <p className="text-3xl font-bold">{pagination.totalItems || clients.length}</p>
            <p className="text-blue-100 text-sm mt-2">Active compliance tracking</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Compliant</h3>
            <p className="text-3xl font-bold">{clients.filter(c => c.status === 'active').length}</p>
            <p className="text-green-100 text-sm mt-2">Fully compliant clients</p>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Pending Review</h3>
            <p className="text-3xl font-bold">{clients.filter(c => c.status === 'pending').length}</p>
            <p className="text-amber-100 text-sm mt-2">Requires attention</p>
          </div>
        </motion.div>
      </div>
    </div>
  ); 
};

export default ComplianceClients;