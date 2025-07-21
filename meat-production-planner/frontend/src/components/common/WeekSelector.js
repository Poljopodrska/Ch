import React from 'react';

const WeekSelector = ({ weeks, selectedWeek, onWeekChange }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Izberite teden</h3>
      <div className="flex flex-wrap gap-2">
        {weeks.map((week, index) => (
          <button
            key={index}
            onClick={() => onWeekChange(index)}
            className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
              selectedWeek === index
                ? 'bg-primary-100 text-primary-800 border-2 border-primary-300'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
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
  );
};

export default WeekSelector;