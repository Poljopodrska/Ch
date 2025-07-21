import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import WeekSelector from '../components/common/WeekSelector';
import SalesDetailView from '../components/planning/SalesDetailView';
import SalesBulkView from '../components/planning/SalesBulkView';

const SalesPlanning = () => {
  const { selectedWeek, setSelectedWeek, weeks } = useApp();
  const [isBulkView, setIsBulkView] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planiranje prodaje</h1>
          <p className="mt-1 text-sm text-gray-500">
            Načrtujte prodajo po strankah in izdelkih
          </p>
        </div>
        <button
          onClick={() => setIsBulkView(!isBulkView)}
          className="px-4 py-2 bg-white text-primary-700 rounded-lg border border-primary-300 hover:bg-primary-50 transition-colors text-sm font-medium"
        >
          {isBulkView ? 'Preklapljaj na detajlni prikaz' : 'Preklapljaj na skupinski vnos'}
        </button>
      </div>

      {!isBulkView && (
        <WeekSelector
          weeks={weeks}
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
        />
      )}

      {isBulkView ? <SalesBulkView /> : <SalesDetailView />}
    </div>
  );
};

export default SalesPlanning;