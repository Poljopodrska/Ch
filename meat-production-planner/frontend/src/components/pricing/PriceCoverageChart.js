import React from 'react';

const PriceCoverageChart = ({ products }) => {
  // Calculate coverage for each product
  const coverageData = products.map(product => {
    const costs = {
      production: parseFloat(product.production_cost || 0),
      productionOH: parseFloat(product.production_oh || 0),
      marketing: parseFloat(product.marketing_oh || 0),
      general: parseFloat(product.general_oh || 0),
      logistics: parseFloat(product.logistics_oh || 0)
    };

    const actualPrice = parseFloat(product.actual_price || 0);
    
    // Calculate cumulative costs
    const cumulativeCosts = {
      production: costs.production,
      productionOH: costs.production + costs.productionOH,
      marketing: costs.production + costs.productionOH + costs.marketing,
      general: costs.production + costs.productionOH + costs.marketing + costs.general,
      logistics: Object.values(costs).reduce((sum, cost) => sum + cost, 0)
    };

    // Calculate what percentage of each cost type is covered
    const coverage = {};
    Object.entries(cumulativeCosts).forEach(([key, cumulativeCost]) => {
      if (actualPrice >= cumulativeCost) {
        coverage[key] = 100;
      } else if (key === 'production' && actualPrice > 0) {
        coverage[key] = (actualPrice / cumulativeCost) * 100;
      } else {
        // For other costs, calculate partial coverage
        const prevKey = Object.keys(cumulativeCosts)[Object.keys(cumulativeCosts).indexOf(key) - 1];
        const prevCost = prevKey ? cumulativeCosts[prevKey] : 0;
        if (actualPrice > prevCost) {
          coverage[key] = ((actualPrice - prevCost) / (cumulativeCost - prevCost)) * 100;
        } else {
          coverage[key] = 0;
        }
      }
    });

    const margin = ((actualPrice - cumulativeCosts.logistics) / actualPrice) * 100;

    return {
      ...product,
      coverage,
      margin: actualPrice > 0 ? margin : 0,
      totalCost: cumulativeCosts.logistics,
      priceDeficit: Math.max(0, cumulativeCosts.logistics - actualPrice)
    };
  });

  // Sort by margin
  coverageData.sort((a, b) => a.margin - b.margin);

  const costTypes = [
    { key: 'production', label: 'Production', color: 'bg-blue-500' },
    { key: 'productionOH', label: 'Production OH', color: 'bg-blue-400' },
    { key: 'marketing', label: 'Marketing OH', color: 'bg-amber-500' },
    { key: 'general', label: 'General OH', color: 'bg-emerald-500' },
    { key: 'logistics', label: 'Logistics OH', color: 'bg-violet-500' }
  ];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        {costTypes.map(type => (
          <div key={type.key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${type.color}`}></div>
            <span>{type.label}</span>
          </div>
        ))}
      </div>

      {/* Coverage bars */}
      <div className="space-y-3">
        {coverageData.map((product, index) => (
          <div key={product.id || index} className="bg-white rounded-lg p-4 shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-sm text-gray-600">
                  Price: €{product.actual_price} | Cost: €{product.totalCost.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-semibold ${product.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Margin: {product.margin.toFixed(1)}%
                </span>
                {product.priceDeficit > 0 && (
                  <p className="text-xs text-red-600">
                    Deficit: €{product.priceDeficit.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Stacked coverage bar */}
            <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
              {costTypes.map((type, typeIndex) => {
                const coverage = product.coverage[type.key];
                return (
                  <div
                    key={type.key}
                    className={`absolute h-full ${type.color} transition-all duration-300`}
                    style={{
                      left: `${typeIndex * 20}%`,
                      width: `${coverage * 0.2}%`,
                      opacity: coverage > 0 ? 1 : 0.3
                    }}
                    title={`${type.label}: ${coverage.toFixed(1)}% covered`}
                  />
                );
              })}
              
              {/* 100% coverage line */}
              <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-800"></div>
              
              {/* Actual price position */}
              <div 
                className="absolute top-0 h-full w-1 bg-green-600"
                style={{ 
                  left: `${Math.min(100, (product.actual_price / product.totalCost) * 100)}%` 
                }}
              >
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-green-600 whitespace-nowrap">
                  {((product.actual_price / product.totalCost) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Coverage breakdown */}
            <div className="mt-2 flex gap-4 text-xs text-gray-600">
              {costTypes.map(type => (
                <span key={type.key}>
                  {type.label}: {product.coverage[type.key].toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
        <div>
          <p className="text-sm text-gray-600">Products with positive margin</p>
          <p className="text-2xl font-bold text-green-600">
            {coverageData.filter(p => p.margin >= 0).length}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Products with negative margin</p>
          <p className="text-2xl font-bold text-red-600">
            {coverageData.filter(p => p.margin < 0).length}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Average margin</p>
          <p className="text-2xl font-bold">
            {(coverageData.reduce((sum, p) => sum + p.margin, 0) / coverageData.length).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceCoverageChart;