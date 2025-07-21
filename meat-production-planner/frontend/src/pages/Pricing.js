import React, { useState, useEffect } from 'react';
import { productsAPI, customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import PricingMatrix from '../components/pricing/PricingMatrix';
import PricingAnalysis from '../components/pricing/PricingAnalysis';

const Pricing = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('matrix');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        productsAPI.getAll(),
        customersAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error('Napaka pri nalaganju podatkov');
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
        <h1 className="text-2xl font-bold text-gray-900">Cene</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upravljanje cen izdelkov po strankah
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'matrix'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">💰</span>
              Cenovna matrika
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analysis'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">📊</span>
              Analiza pokritosti
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'matrix' && (
            <PricingMatrix products={products} customers={customers} />
          )}
          {activeTab === 'analysis' && (
            <PricingAnalysis products={products} customers={customers} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Pricing;