import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { addDays, isPast, isWeekend } from 'date-fns';

const SalesBulkView = () => {
  const {
    products,
    customers,
    salesData,
    updateSalesData,
    weeks,
    days,
  } = useApp();

  const weeksToShow = Array.from({ length: 12 }, (_, i) => i);

  const getWeekDates = (weekIndex) => {
    const weekStart = weeks[weekIndex].startDate;
    return days.map((day, index) => {
      const date = addDays(weekStart, index);
      return {
        day,
        date: date.toLocaleDateString('sl-SI', { month: 'short', day: 'numeric' }),
        fullDate: date,
        isPast: isPast(date),
        isWeekend: isWeekend(date),
      };
    });
  };

  return (
    <div className="bg-blue-50 rounded-xl shadow-lg overflow-hidden border-2 border-blue-200">
      <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 border-b border-blue-300">
        <h2 className="text-xl font-bold text-blue-900">Planiranje prodaje - Skupinski vnos</h2>
      </div>

      <div className="p-4 overflow-x-auto">
        {products.map((product) => (
          <div key={product.id} className="mb-8 bg-white rounded-lg shadow-sm border border-blue-200">
            <div className="bg-blue-100 p-3 rounded-t-lg">
              <h3 className="font-bold text-blue-900 text-lg">{product.name} ({product.unit})</h3>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th rowSpan="2" className="text-left px-2 py-2 font-semibold text-blue-900 sticky left-0 bg-white border-r-2 border-blue-300">
                      Stranka
                    </th>
                    {weeksToShow.map(weekIndex => (
                      <th key={weekIndex} colSpan="7" className="text-center px-2 py-1 bg-blue-200 border-x-2 border-blue-300">
                        <div className="text-xs font-bold text-blue-900">{weeks[weekIndex].label}</div>
                        <div className="text-xs text-blue-700">{weeks[weekIndex].dateRange}</div>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {weeksToShow.map(weekIndex => {
                      const weekDates = getWeekDates(weekIndex);
                      return weekDates.map((dayInfo, dayIndex) => (
                        <th
                          key={`${weekIndex}-${dayIndex}`}
                          className={`text-center px-1 py-2 min-w-[60px] ${
                            dayIndex === 0 ? 'border-l-2 border-blue-300' : ''
                          } ${
                            dayInfo.isPast ? 'bg-gray-100' : dayInfo.isWeekend ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className={`font-semibold text-xs ${
                            dayInfo.isPast ? 'text-gray-500' : 'text-blue-900'
                          }`}>
                            {dayInfo.day}
                          </div>
                          <div className={`text-xs ${
                            dayInfo.isPast ? 'text-gray-400' : 'text-blue-700'
                          }`}>
                            {dayInfo.date}
                          </div>
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-blue-100">
                      <td className="px-2 py-2 sticky left-0 bg-white border-r-2 border-blue-300">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: customer.color }}
                          />
                          <span className="text-sm text-gray-700">{customer.name}</span>
                        </div>
                      </td>
                      {weeksToShow.map(weekIndex => {
                        const weekDates = getWeekDates(weekIndex);
                        return days.map((day, dayIndex) => {
                          const isDisabled = weekDates[dayIndex].isPast;
                          const isWeekendDay = weekDates[dayIndex].isWeekend;
                          const key = `${product.id}-${customer.id}-${weekIndex}-${day}`;
                          const value = salesData[key] || '';

                          return (
                            <td
                              key={`${weekIndex}-${dayIndex}`}
                              className={`px-1 py-1 text-center ${
                                dayIndex === 0 ? 'border-l-2 border-blue-300' : ''
                              } ${
                                isDisabled ? 'bg-gray-100' : isWeekendDay ? 'bg-blue-50' : ''
                              }`}
                            >
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                disabled={isDisabled}
                                className={`w-full px-1 py-1 border rounded text-center text-sm focus:outline-none ${
                                  isDisabled
                                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-white border-blue-300 focus:border-blue-500'
                                }`}
                                value={value}
                                onChange={(e) => updateSalesData(product.id, customer.id, day, e.target.value, weekIndex)}
                              />
                            </td>
                          );
                        });
                      })}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-blue-300 bg-blue-50 font-bold">
                    <td className="px-2 py-2 text-blue-900 sticky left-0 bg-blue-50 border-r-2 border-blue-300">
                      SKUPAJ
                    </td>
                    {weeksToShow.map(weekIndex => {
                      const weekDates = getWeekDates(weekIndex);
                      return days.map((day, dayIndex) => {
                        const isDisabled = weekDates[dayIndex].isPast;
                        const isWeekendDay = weekDates[dayIndex].isWeekend;
                        const dayTotal = customers.reduce((total, customer) => {
                          const key = `${product.id}-${customer.id}-${weekIndex}-${day}`;
                          return total + (salesData[key] || 0);
                        }, 0);

                        return (
                          <td
                            key={`${weekIndex}-${dayIndex}`}
                            className={`px-1 py-2 text-center text-blue-900 ${
                              dayIndex === 0 ? 'border-l-2 border-blue-300' : ''
                            } ${
                              isDisabled ? 'bg-gray-100' : isWeekendDay ? 'bg-blue-100' : 'bg-blue-50'
                            }`}
                          >
                            {dayTotal || '-'}
                          </td>
                        );
                      });
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesBulkView;