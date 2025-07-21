import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { dashboardAPI } from '../services/api';
import KPICard from '../components/dashboard/KPICard';
import WeeklySummaryChart from '../components/dashboard/WeeklySummaryChart';
import ProductionEfficiencyChart from '../components/dashboard/ProductionEfficiencyChart';
import InventoryStatusTable from '../components/dashboard/InventoryStatusTable';

const Dashboard = () => {
  const { products, customers, workers } = useApp();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getKPIs();
      setKpis(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pregled ključnih kazalnikov uspešnosti in trenutnega stanja
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Tedenski plan prodaje"
          value={kpis?.weeklyPlannedSales || 0}
          unit="kg"
          icon="🛒"
          color="blue"
          trend={kpis?.salesTrend}
        />
        <KPICard
          title="Tedenski plan proizvodnje"
          value={kpis?.weeklyPlannedProduction || 0}
          unit="kg"
          icon="🏭"
          color="green"
          trend={kpis?.productionTrend}
        />
        <KPICard
          title="Trenutna zaloga"
          value={kpis?.currentInventory || 0}
          unit="kg"
          icon="📦"
          color="purple"
          trend={kpis?.inventoryTrend}
        />
        <KPICard
          title="Razpoložljivi delavci danes"
          value={kpis?.availableWorkersToday || 0}
          unit={`/ ${workers.length}`}
          icon="👥"
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tedenski pregled prodaje in proizvodnje
          </h2>
          <WeeklySummaryChart />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Učinkovitost proizvodnje
          </h2>
          <ProductionEfficiencyChart />
        </div>
      </div>

      {/* Inventory Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Status zaloge po izdelkih
          </h2>
        </div>
        <InventoryStatusTable products={products} />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hitre akcije</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => window.location.href = '/sales-planning'}
            className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <span className="text-2xl mr-2">🛒</span>
            <span className="font-medium text-gray-700">Planiranje prodaje</span>
          </button>
          <button
            onClick={() => window.location.href = '/production-planning'}
            className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <span className="text-2xl mr-2">🏭</span>
            <span className="font-medium text-gray-700">Planiranje proizvodnje</span>
          </button>
          <button
            onClick={() => window.location.href = '/planning-overview'}
            className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <span className="text-2xl mr-2">📋</span>
            <span className="font-medium text-gray-700">Plan naslednji teden</span>
          </button>
          <button
            onClick={() => window.location.href = '/reports'}
            className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <span className="text-2xl mr-2">📈</span>
            <span className="font-medium text-gray-700">Izvozi poročilo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;