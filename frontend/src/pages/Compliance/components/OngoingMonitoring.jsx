import React, { useState } from 'react';
import { 
  ChartBarIcon,
  BellIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const OngoingMonitoring = ({ client }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [activeAlert, setActiveAlert] = useState(null);

  const alerts = [
    {
      id: 1,
      type: 'transaction',
      severity: 'high',
      title: 'Unusual Transaction Pattern',
      description: 'Multiple high-value transactions detected',
      date: '2024-01-22',
      status: 'open'
    },
    {
      id: 2,
      type: 'media',
      severity: 'medium',
      title: 'New Media Mention',
      description: 'Client mentioned in financial news article',
      date: '2024-01-21',
      status: 'reviewing'
    },
    {
      id: 3,
      type: 'compliance',
      severity: 'low',
      title: 'Document Expiry',
      description: 'ID document expires in 30 days',
      date: '2024-01-20',
      status: 'resolved'
    }
  ];

  const activities = [
    { date: '2024-01-22', type: 'Transaction', amount: '$15,000', status: 'flagged' },
    { date: '2024-01-21', type: 'Transaction', amount: '$3,500', status: 'normal' },
    { date: '2024-01-20', type: 'Document Update', amount: '-', status: 'completed' },
    { date: '2024-01-19', type: 'Transaction', amount: '$8,200', status: 'normal' },
    { date: '2024-01-18', type: 'Review', amount: '-', status: 'completed' }
  ];

  const riskScoreData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    datasets: [
      {
        label: 'Risk Score',
        data: [25, 28, 24, 30, 35, 32, 38],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const transactionData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    datasets: [
      {
        label: 'Transaction Volume',
        data: [45000, 52000, 48000, 61000, 58000, 72000, 85000],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'reviewing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <ChartBarIcon className="h-8 w-8 text-blue-200" />
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-200" />
          </div>
          <p className="text-3xl font-bold">38</p>
          <p className="text-blue-100 text-sm">Current Risk Score</p>
          <p className="text-xs text-blue-200 mt-2">↑ 6 from last month</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <CurrencyDollarIcon className="h-8 w-8 text-green-200" />
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-200" />
          </div>
          <p className="text-3xl font-bold">$85K</p>
          <p className="text-green-100 text-sm">Monthly Volume</p>
          <p className="text-xs text-green-200 mt-2">↑ 18% increase</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <BellIcon className="h-8 w-8 text-amber-200" />
            <span className="px-2 py-1 bg-amber-700 rounded-full text-xs">Active</span>
          </div>
          <p className="text-3xl font-bold">3</p>
          <p className="text-amber-100 text-sm">Active Alerts</p>
          <p className="text-xs text-amber-200 mt-2">2 require action</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <DocumentCheckIcon className="h-8 w-8 text-purple-200" />
            <CheckCircleIcon className="h-5 w-5 text-purple-200" />
          </div>
          <p className="text-3xl font-bold">98%</p>
          <p className="text-purple-100 text-sm">Compliance Rate</p>
          <p className="text-xs text-purple-200 mt-2">Excellent standing</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Risk Score Trend</h3>
            <select 
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="3months">3 Months</option>
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
            </select>
          </div>
          <div className="h-64">
            <Line data={riskScoreData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-6">Transaction Volume</h3>
          <div className="h-64">
            <Bar data={transactionData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <BellIcon className="h-6 w-6 mr-2 text-amber-600" />
            Recent Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setActiveAlert(alert)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(alert.status)}
                      <h4 className="font-semibold">{alert.title}</h4>
                    </div>
                    <p className="text-sm opacity-75">{alert.description}</p>
                    <p className="text-xs mt-2 opacity-50">{alert.date}</p>
                  </div>
                  <button className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Recent Activities
          </h3>
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'flagged' ? 'bg-red-500' : 
                    activity.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-sm">{activity.type}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{activity.amount}</p>
                  {activity.status === 'flagged' && (
                    <span className="text-xs text-red-600">Flagged</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">Monitoring Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Screening Frequency</p>
            <p className="font-semibold">Daily</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Risk Threshold</p>
            <p className="font-semibold">Medium (50)</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Next Review</p>
            <p className="font-semibold">Feb 15, 2024</p>
          </div>
        </div>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Configure Settings
        </button>
      </motion.div>
    </div>
  );
};

export default OngoingMonitoring;