import React from 'react';
import { useApp } from '../contexts/AppContext';
import WeekSelector from '../components/common/WeekSelector';
import ProductionDetailView from '../components/planning/ProductionDetailView';

const ProductionPlanning = () => {
  const { selectedWeek, setSelectedWeek, weeks } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planiranje proizvodnje</h1>
        <p className="mt-1 text-sm text-gray-500">
          Načrtujte proizvodnjo glede na potrebe prodaje in razpoložljivost delavcev
        </p>
      </div>

      <WeekSelector
        weeks={weeks}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
      />

      <ProductionDetailView />
    </div>
  );
};

export default ProductionPlanning;