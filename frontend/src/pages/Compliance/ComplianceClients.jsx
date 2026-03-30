import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { MagnifyingGlassIcon, UserGroupIcon, DocumentTextIcon, ShieldCheckIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { format } from 'date-fns';
import XLSX from 'xlsx-js-style';
import { useAuth } from '../../context/AuthContext';

const ComplianceClients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [localUser, setLocalUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingCdd, setUpdatingCdd] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [stats, setStats] = useState({
    totalClients: 0,
    totalActive: 0,
    totalPending: 0,
    totalInactive: 0,
    totalEDD: 0
  });
  const [exporting, setExporting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [searchInfo, setSearchInfo] = useState(null);

  // Auth check
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setLocalUser(JSON.parse(storedUser));
    }
    setAuthChecked(true);
  }, []);

  const currentUser = user || localUser;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authChecked && !currentUser) {
      navigate('/login');
    }
  }, [authChecked, currentUser, navigate]);

  const handleCddTypeChange = async (clientId, newCddType, e) => {
    e.stopPropagation();
    setUpdatingCdd(prev => ({ ...prev, [clientId]: true }));
    try {
      const client = clients.find(c => c._id === clientId);
      if (client) {
        const oldCddType = client.cddType;
        await axios.put(`/clients/${encodeURIComponent(client.email)}/cdd-type`, {
          cddType: newCddType
        });
        setClients(prev => prev.map(c =>
          c._id === clientId ? { ...c, cddType: newCddType } : c
        ));
        // Update EDD count in stats
        setStats(prev => {
          let eddDiff = 0;
          if (oldCddType === 'EDD' && newCddType !== 'EDD') eddDiff = -1;
          if (oldCddType !== 'EDD' && newCddType === 'EDD') eddDiff = 1;
          return { ...prev, totalEDD: prev.totalEDD + eddDiff };
        });
      }
    } catch (error) {
      console.error('Error updating CDD type:', error);
    } finally {
      setUpdatingCdd(prev => ({ ...prev, [clientId]: false }));
    }
  };

  // Only fetch clients when authenticated
  useEffect(() => {
    if (authChecked && currentUser) {
      fetchClients();
    }
  }, [authChecked, currentUser]);

  const performSearch = useCallback(async (query, statusFilter) => {
    if (!query || query.trim().length < 2) {
      setSearchInfo(null);
      await fetchRegularClients(1, statusFilter);
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);

      const response = await axios.get('/clients/compliance/search', {
        params: {
          query: query.trim(),
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });

      const transformedClients = response.data.clients.map(client => ({
        _id: client._id,
        name: client.name,
        email: client.gmail,
        company: client.startingPoint,
        phone: client.phone || client.contactNumber || '',
        address: client.address || '',
        status: client.clientStatus || getClientStatus(client),
        riskLevel: getRiskLevel(client),
        lastReview: client.lastReviewDate ? format(new Date(client.lastReviewDate), 'MMM dd, yyyy') : null,
        clientCode: client.clientCode || '',
        crNo: client.crNo || '',
        cddType: client.cddType || '',
        searchMatches: client.searchMatches || []
      }));

      setClients(transformedClients);

      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }

      if (response.data.stats) {
        setStats({
          totalClients: response.data.stats.totalClients || 0,
          totalActive: response.data.stats.totalActive || 0,
          totalPending: response.data.stats.totalPending || 0,
          totalInactive: response.data.stats.totalInactive || 0,
          totalEDD: response.data.stats.totalEDD || 0
        });
      }

      if (response.data.searchInfo) {
        setSearchInfo(response.data.searchInfo);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
      setClients([]);
      setSearchInfo(null);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, []);

  const fetchRegularClients = async (page = 1, statusFilter = filter) => {
    try {
      setLoading(true);

      let queryParams = `limit=10&page=${page}`;
      if (statusFilter !== 'all') {
        queryParams += `&status=${statusFilter}`;
      }

      const response = await axios.get(`/clients/compliance/all?${queryParams}`);

      const transformedClients = response.data.clients.map(client => ({
        _id: client._id,
        name: client.name,
        email: client.gmail,
        company: client.startingPoint,
        phone: client.phone || client.contactNumber || '',
        address: client.address || '',
        status: client.clientStatus || getClientStatus(client),
        riskLevel: getRiskLevel(client),
        lastReview: client.lastReviewDate ? format(new Date(client.lastReviewDate), 'MMM dd, yyyy') : null,
        clientCode: client.clientCode || '',
        crNo: client.crNo || '',
        cddType: client.cddType || ''
      }));

      setClients(transformedClients);

      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }

      if (response.data.stats) {
        setStats({
          totalClients: response.data.stats.totalClients || 0,
          totalActive: response.data.stats.totalActive || 0,
          totalPending: response.data.stats.totalPending || 0,
          totalInactive: response.data.stats.totalInactive || 0,
          totalEDD: response.data.stats.totalEDD || 0
        });
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (!authChecked || !currentUser) return;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      performSearch(searchTerm, filter);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm, filter, performSearch]);

  // Initial load when filter changes and no search term
  useEffect(() => {
    if (!authChecked || !currentUser) return;
    if (!searchTerm) {
      fetchRegularClients(1, filter);
    }
  }, [filter]);

  const fetchClients = async (page = 1) => {
    if (searchTerm && searchTerm.trim().length >= 2) {
      await performSearch(searchTerm, filter);
    } else {
      await fetchRegularClients(page, filter);
    }
  };

  const handlePageChange = (newPage) => {
    fetchClients(newPage);
  };

  const getClientStatus = (client) => {
    if (client.nonCancelledJobCount > 0) {
      return 'active';
    } else if (client.jobCount > 0) {
      return 'inactive';
    }
    return 'pending';
  };

  const getRiskLevel = (client) => {
    if (client.riskLevel) {
      return client.riskLevel.toLowerCase();
    }
    return 'pending';
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

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
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

  const handleExportExcel = async () => {
    try {
      setExporting(true);

      let queryParams = '';
      if (searchTerm) {
        queryParams += `?search=${encodeURIComponent(searchTerm)}`;
      }
      if (filter !== 'all') {
        queryParams += `${queryParams ? '&' : '?'}status=${filter}`;
      }

      const response = await axios.get(`/clients/compliance/export${queryParams}`, {
        timeout: 300000
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch export data');
      }

      const dataToExport = response.data.data;

      let fileName = 'Compliance_All_Clients';
      if (searchTerm) {
        fileName = `Compliance_Search_${searchTerm}`;
      } else if (filter === 'active') {
        fileName = 'Compliance_Active_Clients';
      } else if (filter === 'pending') {
        fileName = 'Compliance_Pending_Clients';
      } else if (filter === 'inactive') {
        fileName = 'Compliance_Inactive_Clients';
      } else if (filter === 'edd') {
        fileName = 'Compliance_EDD_Clients';
      }

      const headers = [
        'No', 'Client Code', 'Client Name', 'Registration No', 'Incorporation Date',
        'Registered Authority', 'Registered Address', 'Offered Services (Service Type)',
        'Director', 'Director Passport/QID', 'Shareholder', 'Shareholder Passport/QID',
        'SEF', 'SEF Passport/QID', 'Secretary', 'Secretary Passport/QID',
        'UBO Name', 'UBO Passport/QID', 'UBO Nationality (Country)',
        'Active Status', 'CDD Type', 'Risk Level',
        'Key Contact Person', 'Key Contact Email', 'Key Contact Phone'
      ];

      const yellowCols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
      const greenCols = [19, 20, 21, 22, 23, 24];

      const borderStyle = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      };

      const yellowHeaderStyle = {
        fill: { fgColor: { rgb: 'FFFF00' } },
        font: { bold: true, sz: 11, color: { rgb: '000000' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderStyle
      };

      const greenHeaderStyle = {
        fill: { fgColor: { rgb: '92D050' } },
        font: { bold: true, sz: 11, color: { rgb: '000000' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderStyle
      };

      const cellStyle = {
        alignment: { vertical: 'center', wrapText: true },
        border: borderStyle
      };

      const wsData = [headers];
      dataToExport.forEach(row => {
        wsData.push(headers.map(h => row[h] || ''));
      });

      const worksheet = XLSX.utils.aoa_to_sheet(wsData);

      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; C++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (worksheet[headerCell]) {
          if (yellowCols.includes(C)) {
            worksheet[headerCell].s = yellowHeaderStyle;
          } else if (greenCols.includes(C)) {
            worksheet[headerCell].s = greenHeaderStyle;
          }
        }
      }

      for (let R = 1; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cell = XLSX.utils.encode_cell({ r: R, c: C });
          if (worksheet[cell]) {
            worksheet[cell].s = cellStyle;
          } else {
            worksheet[cell] = { v: '', s: cellStyle };
          }
        }
      }

      worksheet['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 28 }, { wch: 15 }, { wch: 16 },
        { wch: 18 }, { wch: 32 }, { wch: 28 },
        { wch: 25 }, { wch: 22 }, { wch: 25 }, { wch: 22 },
        { wch: 25 }, { wch: 22 }, { wch: 25 }, { wch: 22 },
        { wch: 25 }, { wch: 22 }, { wch: 22 },
        { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 25 }, { wch: 30 }, { wch: 18 }
      ];

      worksheet['!rows'] = [{ hpt: 35 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Compliance Clients');

      XLSX.writeFile(workbook, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setExporting(false);
    }
  };

  // Show loading screen while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!currentUser) {
    return null;
  }

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
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon
                    className={`h-5 w-5 transition-colors ${
                      isSearching
                        ? "text-blue-500 animate-pulse"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search clients, person details, company info..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setSearchInfo(null); }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      Searching in: Client info, Person details (Directors, Shareholders, Secretaries, SEF), Company details
                    </span>
                    {isSearching && (
                      <span className="text-blue-600 animate-pulse">
                        Searching...
                      </span>
                    )}
                  </div>
                  {searchTerm.length < 2 && (
                    <div className="text-amber-600 mt-1">
                      Enter at least 2 characters to search
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`p-4 rounded-xl transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <p className="text-2xl font-bold">{stats.totalClients}</p>
              <p className="text-sm font-medium">Total Clients</p>
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`p-4 rounded-xl transition-all ${
                filter === 'active'
                  ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-400'
                  : 'bg-green-50 text-green-800 hover:bg-green-100'
              }`}
            >
              <p className="text-2xl font-bold">{stats.totalActive}</p>
              <p className="text-sm font-medium">Active</p>
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`p-4 rounded-xl transition-all ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white shadow-lg ring-2 ring-yellow-400'
                  : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
              }`}
            >
              <p className="text-2xl font-bold">{stats.totalPending}</p>
              <p className="text-sm font-medium">Pending</p>
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`p-4 rounded-xl transition-all ${
                filter === 'inactive'
                  ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              <p className="text-2xl font-bold">{stats.totalInactive}</p>
              <p className="text-sm font-medium">Inactive</p>
            </button>
            <button
              onClick={() => setFilter('edd')}
              className={`p-4 rounded-xl transition-all ${
                filter === 'edd'
                  ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              <p className="text-2xl font-bold">{stats.totalEDD}</p>
              <p className="text-sm font-medium">EDD Clients</p>
            </button>
          </div>

          {/* Search Results Indicator */}
          {searchTerm && searchTerm.length >= 2 && !loading && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    Search Results: <span className="text-blue-600">Found {clients.length} client{clients.length !== 1 ? 's' : ''} matching "{searchTerm}"</span>
                  </span>
                </div>
                <button
                  onClick={() => { setSearchTerm(''); setSearchInfo(null); }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear search
                </button>
              </div>
              {searchInfo && searchInfo.matchCounts && (
                <div className="text-sm text-blue-700">
                  <span className="text-gray-600">Matches in: </span>
                  {searchInfo.matchCounts.director > 0 && (
                    <span className="text-blue-600">director ({searchInfo.matchCounts.director}), </span>
                  )}
                  {searchInfo.matchCounts.shareholder > 0 && (
                    <span className="text-blue-600">shareholder ({searchInfo.matchCounts.shareholder}), </span>
                  )}
                  {searchInfo.matchCounts.secretary > 0 && (
                    <span className="text-blue-600">secretary ({searchInfo.matchCounts.secretary}), </span>
                  )}
                  {searchInfo.matchCounts.sef > 0 && (
                    <span className="text-blue-600">sef ({searchInfo.matchCounts.sef}), </span>
                  )}
                  {searchInfo.matchCounts.client > 0 && (
                    <span className="text-blue-600">client ({searchInfo.matchCounts.client}), </span>
                  )}
                  {searchInfo.matchCounts.company > 0 && (
                    <span className="text-blue-600">company ({searchInfo.matchCounts.company})</span>
                  )}
                </div>
              )}
            </div>
          )}

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
                      Client Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CR No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CDD Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latest Review
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.clientCode || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          {client.name && (
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-800">
                                  {client.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className={client.name ? "ml-4" : ""}>
                            <div className="text-sm font-medium text-gray-900">
                              {client.name || '-'}
                            </div>
                            {client.searchMatches && client.searchMatches.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {client.searchMatches.map((match, idx) => {
                                  const colorMap = {
                                    director: 'bg-blue-100 text-blue-700 border-blue-200',
                                    shareholder: 'bg-purple-100 text-purple-700 border-purple-200',
                                    secretary: 'bg-green-100 text-green-700 border-green-200',
                                    sef: 'bg-orange-100 text-orange-700 border-orange-200',
                                    client: 'bg-gray-100 text-gray-700 border-gray-200',
                                    company: 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                  };
                                  const colorClass = colorMap[match.category] || 'bg-gray-100 text-gray-700 border-gray-200';
                                  return (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${colorClass}`}
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {match.category}: {match.field} - {match.value}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.crNo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={client.cddType || ''}
                          onChange={(e) => handleCddTypeChange(client._id, e.target.value, e)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={updatingCdd[client._id]}
                          className={`text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            updatingCdd[client._id] ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                          }`}
                        >
                          <option value="">Select</option>
                          <option value="SDD">SDD</option>
                          <option value="RDD">RDD</option>
                          <option value="EDD">EDD</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status || 'pending')}`}>
                          {client.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(client.riskLevel)}`}>
                          {client.riskLevel ? client.riskLevel.charAt(0).toUpperCase() + client.riskLevel.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.lastReview || '-'}
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
            className="flex justify-center items-center space-x-2 my-6 flex-wrap gap-y-2"
          >
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              «
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>

            <div className="flex space-x-1">
              {(() => {
                const pages = [];
                const current = pagination.currentPage;
                const total = pagination.totalPages;

                pages.push(1);

                if (current > 4) {
                  pages.push('...');
                }

                const rangeStart = Math.max(2, current - 2);
                const rangeEnd = Math.min(total - 1, current + 2);

                for (let i = rangeStart; i <= rangeEnd; i++) {
                  pages.push(i);
                }

                if (current < total - 3) {
                  pages.push('...');
                }

                if (total > 1) {
                  pages.push(total);
                }

                return pages.map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`dots-${index}`} className="px-2 py-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        current === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              »
            </button>

            <div className="ml-4 flex items-center space-x-2 text-sm text-gray-600">
              <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
              <span>|</span>
              <span>Go to</span>
              <input
                type="number"
                min={1}
                max={pagination.totalPages}
                defaultValue={pagination.currentPage}
                key={pagination.currentPage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= pagination.totalPages) {
                      handlePageChange(page);
                    }
                  }
                }}
                onBlur={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= pagination.totalPages) {
                    handlePageChange(page);
                  }
                }}
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span>({pagination.totalItems} total)</span>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default ComplianceClients;