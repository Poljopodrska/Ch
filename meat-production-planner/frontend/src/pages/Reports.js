import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Reports = () => {
  const [reportType, setReportType] = useState('production');
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'production', label: 'Poročilo o proizvodnji', icon: '🏭' },
    { value: 'sales', label: 'Poročilo o prodaji', icon: '🛒' },
    { value: 'inventory', label: 'Poročilo o zalogi', icon: '📦' },
    { value: 'efficiency', label: 'Poročilo o učinkovitosti', icon: '📊' },
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await reportsAPI.generateProductionReport({
        type: reportType,
        ...dateRange,
      });
      
      // Handle report generation result
      toast.success('Poročilo uspešno generirano');
    } catch (error) {
      toast.error('Napaka pri generiranju poročila');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await reportsAPI.exportData(reportType, format);
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: format === 'excel' ? 'application/vnd.ms-excel' : 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}-${dateRange.startDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Izvoz uspešen');
    } catch (error) {
      toast.error('Napaka pri izvozu');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Poročila</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generirajte in izvozite različna poročila
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Konfiguriraj poročilo
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip poročila
              </label>
              <div className="space-y-2">
                {reportTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      reportType === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      checked={reportType === type.value}
                      onChange={(e) => setReportType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Od datuma
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Do datuma
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generiram...' : 'Generiraj poročilo'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Izvozi poročilo</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span className="mr-2">📊</span>
              Izvozi v Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <span className="mr-2">📄</span>
              Izvozi v PDF
            </button>
          </div>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hitra poročila</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-2">📋</span>
            <span className="font-medium text-gray-700">Tedenski pregled</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-2">💰</span>
            <span className="font-medium text-gray-700">Mesečni prihodki</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <span className="text-2xl mr-2">📦</span>
            <span className="font-medium text-gray-700">Status zaloge</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;