import React from 'react';

const CostBreakdownBar = ({ product, showLabels = true, height = 40 }) => {
  const costs = {
    production: parseFloat(product.production_cost || 0),
    productionOH: parseFloat(product.production_oh || 0),
    marketing: parseFloat(product.marketing_oh || 0),
    general: parseFloat(product.general_oh || 0),
    logistics: parseFloat(product.logistics_oh || 0)
  };

  const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const actualPrice = parseFloat(product.actual_price || 0);
  const maxValue = Math.max(totalCost, actualPrice) * 1.1; // Add 10% padding

  // Calculate percentages
  const percentages = {};
  Object.entries(costs).forEach(([key, value]) => {
    percentages[key] = totalCost > 0 ? (value / totalCost) * 100 : 0;
  });

  // Color scheme
  const colors = {
    production: '#3B82F6', // blue-500
    productionOH: '#60A5FA', // blue-400
    marketing: '#F59E0B', // amber-500
    general: '#10B981', // emerald-500
    logistics: '#8B5CF6' // violet-500
  };

  const labels = {
    production: 'Production Cost',
    productionOH: 'Production OH',
    marketing: 'Marketing OH',
    general: 'General OH',
    logistics: 'Logistics OH'
  };

  return (
    <div className="w-full">
      {/* Cost breakdown bar */}
      <div className="relative mb-2">
        <div 
          className="bg-gray-200 rounded-lg overflow-hidden" 
          style={{ height: `${height}px` }}
        >
          <div className="flex h-full">
            {Object.entries(costs).map(([key, value], index) => {
              const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const cumulativeWidth = Object.entries(costs)
                .slice(0, index)
                .reduce((sum, [_, v]) => sum + (maxValue > 0 ? (v / maxValue) * 100 : 0), 0);
              
              return (
                <div
                  key={key}
                  className="relative group"
                  style={{
                    width: `${width}%`,
                    backgroundColor: colors[key],
                    marginLeft: index === 0 ? '0' : '-1px'
                  }}
                  title={`${labels[key]}: €${value.toFixed(2)} (${percentages[key].toFixed(1)}%)`}
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-10">
                    {labels[key]}: €{value.toFixed(2)}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Total cost marker */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-red-600"
            style={{ left: `${maxValue > 0 ? (totalCost / maxValue) * 100 : 0}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-red-600 whitespace-nowrap">
              Theoretical: €{totalCost.toFixed(2)}
            </div>
          </div>
          
          {/* Actual price marker */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-green-600"
            style={{ left: `${maxValue > 0 ? (actualPrice / maxValue) * 100 : 0}%` }}
          >
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-green-600 whitespace-nowrap">
              Actual: €{actualPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="flex flex-wrap gap-2 mt-8 text-xs">
          {Object.entries(labels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors[key] }}
              ></div>
              <span>{label}: €{costs[key].toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <div className="w-3 h-0.5 bg-red-600"></div>
            <span className="text-red-600">Theoretical Price</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-600"></div>
            <span className="text-green-600">Actual Price</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostBreakdownBar;