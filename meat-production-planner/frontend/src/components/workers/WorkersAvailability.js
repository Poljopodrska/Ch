import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { addDays, isPast, isWeekend } from 'date-fns';

const WorkersAvailability = () => {
  const {
    workers,
    weeks,
    days,
    toggleWorkerVacation,
    isWorkerOnVacation,
    getAvailableWorkersCount,
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
        isWeekend: isWeekend(date),
      };
    });
  };

  return (
    <div className="bg-yellow-50 rounded-xl shadow-lg overflow-hidden border-2 border-yellow-200">
      <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 border-b border-yellow-300">
        <h2 className="text-xl font-bold text-gray-800">Razpoložljivost delavcev</h2>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-800 sticky left-0 bg-yellow-50">
                Delavec
              </th>
              {weeks.map((week, weekIndex) => {
                const weekDates = getWeekDates(weekIndex);
                return weekDates.map((dayInfo, dayIndex) => {
                  const availableWorkers = getAvailableWorkersCount(weekIndex, dayIndex);
                  return (
                    <th
                      key={`${weekIndex}-${dayIndex}`}
                      className={`text-center px-2 py-2 ${
                        dayInfo.isPast ? 'bg-gray-100' : dayInfo.isWeekend ? 'bg-yellow-100' : ''
                      }`}
                    >
                      <div className={`font-semibold text-xs ${
                        dayInfo.isPast ? 'text-gray-500' : 'text-gray-800'
                      }`}>
                        {dayInfo.day}
                      </div>
                      <div className={`text-xs ${
                        dayInfo.isPast ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {dayInfo.date}
                      </div>
                      <div className={`text-xs font-bold mt-1 ${
                        availableWorkers === 0 ? 'text-red-600' : 
                        availableWorkers < 3 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {availableWorkers}/{workers.length}
                      </div>
                    </th>
                  );
                });
              })}
            </tr>
          </thead>
          <tbody>
            {workers.map(worker => (
              <tr key={worker.id} className="border-t border-yellow-200">
                <td className="px-3 py-2 font-medium text-gray-700 sticky left-0 bg-yellow-50">
                  {worker.name}
                </td>
                {weeks.map((week, weekIndex) => {
                  const weekDates = getWeekDates(weekIndex);
                  return weekDates.map((dayInfo, dayIndex) => {
                    const isOnVacation = isWorkerOnVacation(worker.id, weekIndex, dayIndex);
                    return (
                      <td
                        key={`${weekIndex}-${dayIndex}`}
                        className={`text-center px-2 py-2 ${
                          dayInfo.isPast ? 'bg-gray-100' : dayInfo.isWeekend ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <button
                          disabled={dayInfo.isPast}
                          onClick={() => toggleWorkerVacation(worker.id, weekIndex, dayIndex)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                            dayInfo.isPast 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isOnVacation
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {isOnVacation ? 'D' : '✓'}
                        </button>
                      </td>
                    );
                  });
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-yellow-400 bg-yellow-200 font-bold">
              <td className="px-3 py-2 text-gray-900 sticky left-0 bg-yellow-200">
                SKUPAJ NA VOLJO
              </td>
              {weeks.map((week, weekIndex) => {
                const weekDates = getWeekDates(weekIndex);
                return weekDates.map((dayInfo, dayIndex) => {
                  const availableWorkers = getAvailableWorkersCount(weekIndex, dayIndex);
                  return (
                    <td
                      key={`${weekIndex}-${dayIndex}`}
                      className={`text-center px-2 py-2 ${
                        dayInfo.isPast ? 'bg-gray-100' : dayInfo.isWeekend ? 'bg-yellow-100' : 'bg-yellow-200'
                      }`}
                    >
                      <div className={`text-lg ${
                        availableWorkers === 0 ? 'text-red-700' : 
                        availableWorkers < 3 ? 'text-orange-700' : 'text-green-700'
                      }`}>
                        {availableWorkers}
                      </div>
                    </td>
                  );
                });
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-yellow-300 bg-yellow-100">
        <p className="text-sm text-gray-700">
          <strong>Legenda:</strong> ✓ = Delavec je na voljo | D = Dopust
        </p>
      </div>
    </div>
  );
};

export default WorkersAvailability;