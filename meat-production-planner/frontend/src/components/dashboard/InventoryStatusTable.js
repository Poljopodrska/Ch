import React from 'react';
import { useApp } from '../../contexts/AppContext';

const InventoryStatusTable = ({ products }) => {
  const { days, getRunningInventory } = useApp();
  const lastDay = days[days.length - 1];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Izdelek
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trenutna zaloga
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trend
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => {
            const currentInventory = getRunningInventory(product.id, lastDay, 0);
            const previousWeekInventory = getRunningInventory(product.id, lastDay, -1);
            const trend = currentInventory - previousWeekInventory;
            
            return (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className={`font-semibold ${
                    currentInventory > 0 ? 'text-green-600' : 
                    currentInventory < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {currentInventory > 0 ? '+' : ''}{currentInventory} {product.unit}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    currentInventory > 50 ? 'bg-green-100 text-green-800' :
                    currentInventory > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentInventory > 50 ? 'Dobro' : 
                     currentInventory > 0 ? 'Nizko' : 'Kritično'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className={`flex items-center justify-center ${
                    trend > 0 ? 'text-green-600' : 
                    trend < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <span className="mr-1">
                      {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
                    </span>
                    <span className="font-medium">
                      {Math.abs(trend)} {product.unit}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryStatusTable;