import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const SummaryView = () => {
  const { products, weeks, days, getSalesTotal, getProductionValue } = useApp();
  const [viewLevel, setViewLevel] = useState('week');
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);

  // Group weeks by month
  const weeksByMonth = {};
  weeks.forEach((week, index) => {
    const month = week.startDate.toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' });
    if (!weeksByMonth[month]) {
      weeksByMonth[month] = [];
    }
    weeksByMonth[month].push({ week: week.label, index });
  });

  const getWeekTotalSales = (productId, weekIndex) => {
    return days.reduce((total, day) => total + getSalesTotal(productId, day, weekIndex), 0);
  };

  const getWeekTotalProduction = (productId, weekIndex) => {
    return days.reduce((total, day) => total + getProductionValue(productId, day, weekIndex), 0);
  };

  const getMonthTotalSales = (productId, monthWeeks) => {
    return monthWeeks.reduce((total, { index }) => total + getWeekTotalSales(productId, index), 0);
  };

  const getMonthTotalProduction = (productId, monthWeeks) => {
    return monthWeeks.reduce((total, { index }) => total + getWeekTotalProduction(productId, index), 0);
  };

  const toggleWeekSelection = (weekIndex) => {
    setSelectedWeeks(prev => {
      if (prev.includes(weekIndex)) {
        return prev.filter(w => w !== weekIndex);
      } else {
        return [...prev, weekIndex];
      }
    });
  };

  const toggleMonthSelection = (month) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };

  const renderMonthlyView = () => (
    <div>
      <div className="p-4 border-b bg-gray-50">
        <p className="text-sm text-gray-600 mb-2">Izberite mesece za prikaz (lahko izberete več):</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(weeksByMonth).map((month) => (
            <button
              key={month}
              onClick={() => toggleMonthSelection(month)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                selectedMonths.includes(month)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
      {selectedMonths.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Izdelek</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Skupaj prodaja</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Skupaj proizvodnja</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Višek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                const totalSales = selectedMonths.reduce((sum, month) => {
                  const monthWeeks = weeksByMonth[month];
                  return sum + getMonthTotalSales(product.id, monthWeeks);
                }, 0);
                const totalProduction = selectedMonths.reduce((sum, month) => {
                  const monthWeeks = weeksByMonth[month];
                  return sum + getMonthTotalProduction(product.id, monthWeeks);
                }, 0);
                const totalBalance = totalProduction - totalSales;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{product.name}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-700 font-medium">
                      {totalSales > 0 ? totalSales : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-green-700 font-medium">
                      {totalProduction > 0 ? totalProduction : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-orange-700 font-medium">
                      {totalBalance !== 0 ? (totalBalance > 0 ? '+' + totalBalance : totalBalance) : '-'}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                <td className="px-4 py-3 text-sm text-gray-900">SKUPAJ VSE</td>
                <td className="px-4 py-3 text-center text-sm text-blue-900">
                  {products.reduce((total, product) => {
                    return total + selectedMonths.reduce((sum, month) => {
                      const monthWeeks = weeksByMonth[month];
                      return sum + getMonthTotalSales(product.id, monthWeeks);
                    }, 0);
                  }, 0)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-green-900">
                  {products.reduce((total, product) => {
                    return total + selectedMonths.reduce((sum, month) => {
                      const monthWeeks = weeksByMonth[month];
                      return sum + getMonthTotalProduction(product.id, monthWeeks);
                    }, 0);
                  }, 0)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-orange-900">
                  {(() => {
                    const totalSales = products.reduce((total, product) => {
                      return total + selectedMonths.reduce((sum, month) => {
                        const monthWeeks = weeksByMonth[month];
                        return sum + getMonthTotalSales(product.id, monthWeeks);
                      }, 0);
                    }, 0);
                    const totalProd = products.reduce((total, product) => {
                      return total + selectedMonths.reduce((sum, month) => {
                        const monthWeeks = weeksByMonth[month];
                        return sum + getMonthTotalProduction(product.id, monthWeeks);
                      }, 0);
                    }, 0);
                    const totalBalance = totalProd - totalSales;
                    return totalBalance !== 0 ? (totalBalance > 0 ? '+' + totalBalance : totalBalance) : '-';
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderWeeklyView = () => (
    <div>
      <div className="p-4 border-b bg-gray-50">
        <p className="text-sm text-gray-600 mb-2">Izberite tedne za prikaz (lahko izberete več):</p>
        <div className="flex flex-wrap gap-2">
          {weeks.map((week, index) => (
            <button
              key={index}
              onClick={() => toggleWeekSelection(index)}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                selectedWeeks.includes(index)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              <div className="text-center">
                <div>{week.label}</div>
                <div className="text-xs mt-0.5 opacity-75">{week.dateRange}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {selectedWeeks.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Izdelek</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Skupaj prodaja</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Skupaj proizvodnja</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Višek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                const totalSales = selectedWeeks.reduce((sum, weekIndex) => 
                  sum + getWeekTotalSales(product.id, weekIndex), 0);
                const totalProduction = selectedWeeks.reduce((sum, weekIndex) => 
                  sum + getWeekTotalProduction(product.id, weekIndex), 0);
                const totalBalance = totalProduction - totalSales;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{product.name}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-700 font-medium">
                      {totalSales > 0 ? totalSales : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-green-700 font-medium">
                      {totalProduction > 0 ? totalProduction : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-orange-700 font-medium">
                      {totalBalance !== 0 ? (totalBalance > 0 ? '+' + totalBalance : totalBalance) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Pregled proizvodnje</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewLevel('month');
              setSelectedWeeks([]);
              setSelectedMonths([]);
            }}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewLevel === 'month' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            Mesečno
          </button>
          <button
            onClick={() => {
              setViewLevel('week');
              setSelectedWeeks([]);
              setSelectedMonths([]);
            }}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewLevel === 'week' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            Tedensko
          </button>
        </div>
      </div>

      {viewLevel === 'month' && renderMonthlyView()}
      {viewLevel === 'week' && renderWeeklyView()}
    </div>
  );
};

export default SummaryView;