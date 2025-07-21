import React from 'react';
import { useApp } from '../contexts/AppContext';
import WorkersAvailability from '../components/workers/WorkersAvailability';

const Workers = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delavci</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upravljanje razpoložljivosti delavcev in dopustov
        </p>
      </div>

      <WorkersAvailability />
    </div>
  );
};

export default Workers;