import React from 'react';
import { useApp } from '../../contexts/AppContext';

const NextWeekPlan = () => {
  const { products, getProductionValue, weeks, days } = useApp();
  
  // Always show next week (week 1 from current)
  const nextWeekIndex = 1;
  const nextWeek = weeks[nextWeekIndex];

  return (
    <div className="bg-white rounded-xl">
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-t-xl border-b">
        <h2 className="text-xl font-bold text-gray-800">Plan za naslednji teden</h2>
        <p className="text-sm text-gray-600">{nextWeek.label} - {nextWeek.dateRange}</p>
      </div>

      <div className="p-6">
        {days.map((day, dayIndex) => {
          // Get all products with production > 0 for this day
          const dayProduction = products
            .map(product => ({
              name: product.name,
              quantity: getProductionValue(product.id, day, nextWeekIndex),
              unit: product.unit
            }))
            .filter(item => item.quantity > 0);

          if (dayProduction.length === 0) return null;

          return (
            <div key={dayIndex} className="mb-6">
              <div className="bg-indigo-50 px-4 py-2 rounded-t-lg">
                <h3 className="font-bold text-indigo-900">
                  {day} - {new Date(nextWeek.startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000).toLocaleDateString('sl-SI', { month: 'short', day: 'numeric' })}
                </h3>
              </div>
              <div className="border-2 border-indigo-200 border-t-0 rounded-b-lg p-4">
                <ul className="space-y-2">
                  {dayProduction.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-lg mr-2">•</span>
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="ml-auto font-bold text-indigo-700">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}

        {/* If no production planned for next week */}
        {days.every(day => 
          products.every(product => getProductionValue(product.id, day, nextWeekIndex) === 0)
        ) && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">Ni načrtovane proizvodnje za naslednji teden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextWeekPlan;