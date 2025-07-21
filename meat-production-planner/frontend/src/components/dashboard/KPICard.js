import React from 'react';

const KPICard = ({ title, value, unit, icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };

  const trendColorClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center ${trendColorClasses[trend.direction]}`}>
            <span className="text-sm font-medium">{trend.value}%</span>
            <span className="ml-1">
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            </span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {value.toLocaleString('sl-SI')}
          <span className="ml-1 text-lg text-gray-500">{unit}</span>
        </p>
      </div>
    </div>
  );
};

export default KPICard;