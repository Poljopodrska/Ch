import React, { useState, useEffect } from 'react';
import { productsAPI } from '../../services/api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProductCostBreakdown = ({ product, onClose }) => {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCostData();
  }, [product]);

  const loadCostData = async () => {
    try {
      const response = await productsAPI.getCostBreakdown(product.id);
      setCostData(response.data);
    } catch (error) {
      console.error('Error loading cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: ['Material', 'Delo', 'Pakiranje', 'Transport', 'Ostalo'],
    datasets: [
      {
        data: [
          costData?.material || 0,
          costData?.labor || 0,
          costData?.packaging || 0,
          costData?.transport || 0,
          costData?.other || 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      },
    ],
  };

  const totalCost = 
    (costData?.material || 0) +
    (costData?.labor || 0) +
    (costData?.packaging || 0) +
    (costData?.transport || 0) +
    (costData?.other || 0);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Struktura stroškov - {product.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Razdelitev stroškov</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Material:</span>
                  <span className="font-semibold">€{costData?.material?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delo:</span>
                  <span className="font-semibold">€{costData?.labor?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pakiranje:</span>
                  <span className="font-semibold">€{costData?.packaging?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transport:</span>
                  <span className="font-semibold">€{costData?.transport?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ostalo:</span>
                  <span className="font-semibold">€{costData?.other?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Skupaj:</span>
                    <span className="text-lg font-bold text-primary-600">
                      €{totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vizualni prikaz</h3>
              <div className="w-full h-64">
                <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Zapri
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCostBreakdown;