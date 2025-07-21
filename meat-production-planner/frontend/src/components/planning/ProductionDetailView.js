import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { addDays, isPast, isWeekend } from 'date-fns';

const ProductionDetailView = () => {
  const {
    products,
    productionData,
    updateProductionData,
    getSalesTotal,
    getProductionValue,
    getCumulativeSales,
    getCumulativeProduction,
    getRunningInventory,
    disabledProductionDays,
    toggleProductionDay,
    productionComments,
    updateProductionComment,
    getAvailableWorkersCount,
    selectedWeek,
    weeks,
    days,
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

  const weekDates = getWeekDates(selectedWeek);

  const isProductionDisabled = (weekOffset, dayIndex) => {
    return disabledProductionDays[`${weekOffset}-${dayIndex}`] || false;
  };

  const getProductionComment = (weekOffset, dayIndex) => {
    const key = `${weekOffset}-${dayIndex}`;
    const comment = productionComments[key];
    
    if (!comment && isProductionDisabled(weekOffset, dayIndex) && (dayIndex === 5 || dayIndex === 6)) {
      return dayIndex === 5 ? 'Sobota' : 'Nedelja';
    }
    
    return comment || '';
  };

  return (
    <div className="bg-green-50 rounded-xl shadow-lg overflow-hidden border-2 border-green-200">
      <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 border-b border-green-300">
        <div className="grid grid-cols-10 gap-4 mb-3">
          <div className="font-semibold text-green-900">Izdelek</div>
          {weekDates.map((dayInfo, index) => {
            const isDisabled = dayInfo.isPast;
            const isProductionOff = isProductionDisabled(selectedWeek, index);
            const availableWorkers = getAvailableWorkersCount(selectedWeek, index);
            return (
              <div key={index} className="text-center">
                <div className={`font-semibold ${isDisabled || isProductionOff ? 'text-gray-500' : 'text-green-900'}`}>
                  {dayInfo.day}
                </div>
                <div className={`text-sm ${isDisabled || isProductionOff ? 'text-gray-400' : 'text-green-700'}`}>
                  {dayInfo.date}
                </div>
                <div className={`text-xs font-bold mt-1 ${
                  isDisabled || isProductionOff ? 'text-gray-400' : 
                  availableWorkers === 0 ? 'text-red-600' : 
                  availableWorkers < 3 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  👥 {availableWorkers}
                </div>
              </div>
            );
          })}
          <div className="font-semibold text-green-900">Tedenski skupaj</div>
          <div className="font-semibold text-green-900">Kumulativno</div>
        </div>
        
        <div className="grid grid-cols-10 gap-4 pt-2 border-t border-green-300">
          <div className="text-xs font-medium text-green-800">Proizvodnja aktivna</div>
          {weekDates.map((dayInfo, index) => {
            const isDisabled = dayInfo.isPast;
            const isProductionOff = isProductionDisabled(selectedWeek, index);
            return (
              <div key={index} className="text-center">
                <button
                  disabled={isDisabled}
                  onClick={() => toggleProductionDay(selectedWeek, index)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    isDisabled 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isProductionOff
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isProductionOff ? 'NE' : 'DA'}
                </button>
              </div>
            );
          })}
          <div></div>
          <div></div>
        </div>
        
        <div className="grid grid-cols-10 gap-4 pt-2 border-t border-green-300">
          <div className="text-xs font-medium text-green-800">Komentar</div>
          {weekDates.map((dayInfo, index) => {
            const isDisabled = dayInfo.isPast;
            const isProductionOff = isProductionDisabled(selectedWeek, index);
            return (
              <div key={index} className="text-center">
                <input
                  type="text"
                  disabled={isDisabled || !isProductionOff}
                  value={getProductionComment(selectedWeek, index)}
                  onChange={(e) => updateProductionComment(selectedWeek, index, e.target.value)}
                  placeholder={isProductionOff ? "Razlog..." : ""}
                  className={`w-full px-1 py-1 text-xs rounded border ${
                    isDisabled || !isProductionOff
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-red-300 text-gray-700 focus:outline-none focus:border-red-500'
                  }`}
                />
              </div>
            );
          })}
          <div></div>
          <div></div>
        </div>
      </div>

      <div className="divide-y-0">
        {products.map((product) => (
          <div key={product.id} className="mb-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-t-lg">
              <div className="flex items-center">
                <span className="text-white mr-2 text-xl">🏭</span>
                <h3 className="font-bold text-white text-xl">{product.name}</h3>
                <span className="ml-2 text-green-100">({product.unit})</span>
              </div>
            </div>
            <div className="bg-green-50 hover:bg-green-100 transition-colors p-4 rounded-b-lg border-2 border-green-200 border-t-0">
              <div className="grid grid-cols-10 gap-4 mb-2">
                <div className="font-medium text-blue-800">Dnevna potreba</div>
                {days.map((day, dayIndex) => {
                  const isDisabled = weekDates[dayIndex].isPast;
                  const isProductionOff = isProductionDisabled(selectedWeek, dayIndex);
                  return (
                    <div key={dayIndex} className={`text-center py-1 rounded font-medium ${
                      isDisabled || isProductionOff
                        ? 'bg-gray-100 text-gray-500' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getSalesTotal(product.id, day)}
                    </div>
                  );
                })}
                <div className="text-center py-1 bg-blue-200 rounded font-bold text-blue-900">
                  {days.reduce((total, day) => total + getSalesTotal(product.id, day), 0)}
                </div>
                <div className="text-center py-1 bg-blue-200 rounded font-bold text-blue-900">
                  {getCumulativeSales(product.id, days[days.length - 1])}
                </div>
              </div>
              
              <div className="grid grid-cols-10 gap-4 mb-2">
                <div className="font-medium text-green-900">Proizvodnja</div>
                {days.map((day, dayIndex) => {
                  const isDisabled = weekDates[dayIndex].isPast || isProductionDisabled(selectedWeek, dayIndex);
                  const isWeekendDay = weekDates[dayIndex].isWeekend;
                  const key = `${product.id}-${selectedWeek}-${day}`;
                  const value = productionData[key] || '';
                  
                  return (
                    <div key={dayIndex}>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        disabled={isDisabled}
                        className={`w-full px-2 py-1 border rounded text-sm focus:outline-none ${
                          isDisabled 
                            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                            : isWeekendDay && !isProductionDisabled(selectedWeek, dayIndex)
                              ? 'bg-green-50 border-green-400 focus:border-green-600'
                              : 'bg-white border-green-400 focus:border-green-600'
                        }`}
                        value={value}
                        onChange={(e) => updateProductionData(product.id, day, e.target.value)}
                      />
                    </div>
                  );
                })}
                <div className="text-center py-1 bg-green-200 rounded font-bold text-green-900">
                  {days.reduce((total, day) => total + getProductionValue(product.id, day), 0)}
                </div>
                <div className="text-center py-1 bg-green-200 rounded font-bold text-green-900">
                  {getCumulativeProduction(product.id, days[days.length - 1])}
                </div>
              </div>
              
              <div className="grid grid-cols-10 gap-4 mt-3 pt-3 border-t-2 border-green-300">
                <div className="font-semibold text-purple-800 flex items-center">
                  <span className="mr-1">📦</span>
                  Trenutna zaloga
                </div>
                {days.map((day, dayIndex) => {
                  const inventory = getRunningInventory(product.id, day, selectedWeek);
                  const colorClass = inventory > 0 ? 'text-green-700 bg-green-100' : 
                                   inventory < 0 ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-100';
                  return (
                    <div key={dayIndex} className={`text-center font-bold rounded px-2 py-1 ${colorClass}`}>
                      {inventory > 0 ? '+' : ''}{inventory}
                    </div>
                  );
                })}
                <div className="text-center py-1 bg-purple-100 rounded font-bold text-purple-800">
                  {getRunningInventory(product.id, days[days.length - 1], selectedWeek)}
                </div>
                <div className="text-center py-1 bg-purple-100 rounded font-bold text-purple-800">
                  {getRunningInventory(product.id, days[days.length - 1], selectedWeek)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductionDetailView;