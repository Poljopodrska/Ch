import React, { useState, useEffect } from 'react';
import { productsAPI, customersAPI } from '../../services/api';

const PricingAnalysis = ({ products, customers }) => {
  const [analysisData, setAnalysisData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysisData();
  }, [products, customers]);

  const loadAnalysisData = async () => {
    try {
      const data = [];
      
      for (const product of products) {
        // Get cost breakdown
        const costResponse = await productsAPI.getCostBreakdown(product.id);
        const totalCost = 
          (costResponse.data?.material || 0) +
          (costResponse.data?.labor || 0) +
          (costResponse.data?.packaging || 0) +
          (costResponse.data?.transport || 0) +
          (costResponse.data?.other || 0);
        
        // Get prices for all customers
        const customerPrices = [];
        let totalRevenue = 0;
        let customerCount = 0;
        
        for (const customer of customers) {
          const priceResponse = await customersAPI.getPricing(customer.id);
          const priceData = priceResponse.data.find(p => p.product_id === product.id);
          
          if (priceData) {
            const margin = ((priceData.price - totalCost) / priceData.price) * 100;
            customerPrices.push({
              customer,
              price: priceData.price,
              margin
            });
            totalRevenue += priceData.price;
            customerCount++;
          }
        }
        
        const avgPrice = customerCount > 0 ? totalRevenue / customerCount : 0;
        const avgMargin = avgPrice > 0 ? ((avgPrice - totalCost) / avgPrice) * 100 : 0;
        
        data.push({
          product,
          totalCost,
          avgPrice,
          avgMargin,
          customerPrices
        });
      }
      
      setAnalysisData(data);
    } catch (error) {
      console.error('Error loading analysis data:', error);
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
      {analysisData.map(({ product, totalCost, avgPrice, avgMargin, customerPrices }) => (
        <div key={product.id} className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <div className="mt-1 flex space-x-4 text-sm text-gray-600">
              <span>Strošek: €{totalCost.toFixed(2)}</span>
              <span>Povprečna cena: €{avgPrice.toFixed(2)}</span>
              <span className={avgMargin > 20 ? 'text-green-600' : avgMargin > 10 ? 'text-yellow-600' : 'text-red-600'}>
                Povprečna marža: {avgMargin.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-2">
              {customerPrices.map(({ customer, price, margin }) => {
                const marginWidth = Math.max(0, Math.min(100, margin));
                const marginColor = margin > 20 ? 'bg-green-500' : margin > 10 ? 'bg-yellow-500' : 'bg-red-500';
                
                return (
                  <div key={customer.id} className="flex items-center space-x-4">
                    <div className="flex items-center w-48">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: customer.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">{customer.name}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="relative h-6 bg-gray-200 rounded overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full ${marginColor} transition-all duration-500`}
                          style={{ width: `${marginWidth}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-2">
                          <span className="text-xs font-medium text-white">€{price.toFixed(2)}</span>
                          <span className="text-xs font-medium text-gray-700">{margin.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {customerPrices.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Ni nastavljenih cen za ta izdelek
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PricingAnalysis;