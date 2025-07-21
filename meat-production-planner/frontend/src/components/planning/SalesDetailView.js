import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { addDays, isPast } from 'date-fns';

const SalesDetailView = () => {
  const {
    products,
    customers,
    salesData,
    updateSalesData,
    getSalesTotal,
    selectedWeek,
    weeks,
    days,
  } = useApp();

  const getWeekDates = (weekIndex) => {
    const weekStart = weeks[weekIndex].startDate;
    return days.map((day, index) => {
      const date = addDays(weekStart, index);
      return {
        day,
        date: date.toLocaleDateString('sl-SI', { month: 'short', day: 'numeric' }),
        fullDate: date,
        isPast: isPast(date),
      };
    });
  };

  const weekDates = getWeekDates(selectedWeek);

  return (
    <div className="bg-blue-50 rounded-xl shadow-lg overflow-hidden border-2 border-blue-200">
      <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 border-b border-blue-300">
        <h2 className="text-xl font-bold text-blue-900">Planiranje prodaje - Detajlni prikaz</h2>
        <div className="grid grid-cols-9 gap-4 mt-4">
          <div className="font-semibold text-blue-900">Izdelek / Stranka</div>
          {weekDates.map((dayInfo, index) => (
            <div key={index} className="text-center">
              <div className={`font-semibold ${dayInfo.isPast ? 'text-gray-500' : 'text-blue-900'}`}>
                {dayInfo.day}
              </div>
              <div className={`text-sm ${dayInfo.isPast ? 'text-gray-400' : 'text-blue-700'}`}>
                {dayInfo.date}
              </div>
            </div>
          ))}
          <div className="font-semibold text-blue-900">Tedenski skupaj</div>
        </div>
      </div>

      <div className="divide-y-8 divide-blue-100">
        {products.map((product, productIndex) => (
          <div key={product.id} className="bg-blue-50 hover:bg-blue-100 transition-colors">
            <div className="p-4">
              <div className="flex items-center mb-4">
                <span className="text-blue-700 mr-2">🛒</span>
                <h3 className="font-semibold text-blue-900 text-lg">{product.name}</h3>
                <span className="ml-2 text-sm text-blue-700">({product.unit})</span>
              </div>

              {customers.map((customer) => (
                <div key={customer.id} className="grid grid-cols-9 gap-4 mb-2 items-center">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: customer.color }}
                    />
                    <span className="text-sm text-blue-800">{customer.name}</span>
                  </div>
                  {days.map((day, dayIndex) => {
                    const isDisabled = weekDates[dayIndex].isPast;
                    const key = `${product.id}-${customer.id}-${selectedWeek}-${day}`;
                    const value = salesData[key] || '';
                    
                    return (
                      <div key={dayIndex}>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          disabled={isDisabled}
                          className={`w-full px-2 py-1 border rounded text-sm focus:outline-none ${
                            isDisabled
                              ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-white border-blue-300 focus:border-blue-500'
                          }`}
                          value={value}
                          onChange={(e) => updateSalesData(product.id, customer.id, day, e.target.value)}
                        />
                      </div>
                    );
                  })}
                  <div className="text-sm font-medium text-blue-800">
                    {days.reduce((total, day) => {
                      const key = `${product.id}-${customer.id}-${selectedWeek}-${day}`;
                      return total + (salesData[key] || 0);
                    }, 0)}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-9 gap-4 mt-3 pt-3 border-t-2 border-blue-300 bg-blue-200 rounded p-2">
                <div className="font-semibold text-blue-900 flex items-center">
                  <span className="mr-1">👥</span>
                  SKUPAJ PRODAJA
                </div>
                {days.map((day, dayIndex) => (
                  <div key={dayIndex} className="text-center font-bold text-blue-900">
                    {getSalesTotal(product.id, day)}
                  </div>
                ))}
                <div className="font-bold text-blue-900 text-center">
                  {days.reduce((total, day) => total + getSalesTotal(product.id, day), 0)}
                </div>
              </div>
            </div>
            {productIndex < products.length - 1 && <div className="h-4 bg-blue-50"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesDetailView;