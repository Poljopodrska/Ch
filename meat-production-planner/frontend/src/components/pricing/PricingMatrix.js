import React, { useState, useEffect } from 'react';
import { customersAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PricingMatrix = ({ products, customers }) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    loadPrices();
  }, [customers]);

  const loadPrices = async () => {
    try {
      const pricesData = {};
      for (const customer of customers) {
        const response = await customersAPI.getPricing(customer.id);
        response.data.forEach(price => {
          pricesData[`${customer.id}-${price.product_id}`] = price.price;
        });
      }
      setPrices(pricesData);
    } catch (error) {
      console.error('Error loading prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async (customerId, productId, newPrice) => {
    try {
      await customersAPI.updatePricing(customerId, productId, parseFloat(newPrice));
      setPrices({
        ...prices,
        [`${customerId}-${productId}`]: parseFloat(newPrice)
      });
      toast.success('Cena uspešno posodobljena');
    } catch (error) {
      toast.error('Napaka pri posodabljanju cene');
    }
    setEditingCell(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
              Izdelek
            </th>
            {customers.map((customer) => (
              <th
                key={customer.id}
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="flex items-center justify-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: customer.color }}
                  />
                  {customer.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                {product.name}
              </td>
              {customers.map((customer) => {
                const key = `${customer.id}-${product.id}`;
                const price = prices[key] || 0;
                const isEditing = editingCell === key;

                return (
                  <td key={customer.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={price}
                        onBlur={(e) => handlePriceUpdate(customer.id, product.id, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handlePriceUpdate(customer.id, product.id, e.target.value);
                          }
                        }}
                        className="w-20 px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingCell(key)}
                        className="w-20 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        €{price.toFixed(2)}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PricingMatrix;