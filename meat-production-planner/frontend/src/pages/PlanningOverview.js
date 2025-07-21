import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import NextWeekPlan from '../components/planning/NextWeekPlan';
import SummaryView from '../components/planning/SummaryView';

const PlanningOverview = () => {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: 'Pregled proizvodnje', icon: '✅' },
    { id: 'nextweek', label: 'Plan naslednji teden', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pregled planiranja</h1>
        <p className="mt-1 text-sm text-gray-500">
          Analizirajte in preglejte načrte proizvodnje
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'summary' && <SummaryView />}
          {activeTab === 'nextweek' && <NextWeekPlan />}
        </div>
      </div>
    </div>
  );
};

export default PlanningOverview;