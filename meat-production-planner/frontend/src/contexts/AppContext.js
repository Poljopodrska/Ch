import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { startOfWeek, addWeeks, format } from 'date-fns';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Core data
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  
  // Planning data
  const [salesData, setSalesData] = useState({});
  const [productionData, setProductionData] = useState({});
  const [disabledProductionDays, setDisabledProductionDays] = useState({});
  const [workerVacations, setWorkerVacations] = useState({});
  const [productionComments, setProductionComments] = useState({});
  
  // UI state
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [viewLevel, setViewLevel] = useState('week');
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Generate weeks data
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start
    
    for (let i = 0; i < 12; i++) {
      const weekStart = addWeeks(currentWeekStart, i);
      const weekEnd = addWeeks(weekStart, 1);
      const weekNum = format(weekStart, 'w');
      
      let label;
      if (i === 0) label = `Teden ${weekNum} (ta teden)`;
      else if (i === 1) label = `Teden ${weekNum} (naslednji teden)`;
      else label = `Teden ${weekNum}`;
      
      weeks.push({
        label,
        dateRange: `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM')}`,
        startDate: weekStart,
        endDate: weekEnd,
        weekNumber: parseInt(weekNum),
        index: i
      });
    }
    return weeks;
  };

  const weeks = generateWeeks();
  const days = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'];

  // Initialize default disabled days (weekends)
  useEffect(() => {
    const initializeDisabledDays = () => {
      const disabled = {};
      for (let w = 0; w < 12; w++) {
        // Saturdays (index 5) and Sundays (index 6) are disabled by default
        disabled[`${w}-5`] = true;
        disabled[`${w}-6`] = true;
      }
      return disabled;
    };

    const initializeProductionComments = () => {
      const comments = {};
      for (let w = 0; w < 12; w++) {
        comments[`${w}-5`] = 'Sobota';
        comments[`${w}-6`] = 'Nedelja';
      }
      return comments;
    };

    setDisabledProductionDays(initializeDisabledDays());
    setProductionComments(initializeProductionComments());
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [productsRes, customersRes, workersRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
        api.get('/workers')
      ]);
      
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
      setWorkers(workersRes.data);
      
      // Load planning data
      await loadPlanningData();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanningData = async () => {
    try {
      const response = await api.get('/planning/current');
      if (response.data) {
        setSalesData(response.data.salesData || {});
        setProductionData(response.data.productionData || {});
        setDisabledProductionDays(response.data.disabledProductionDays || {});
        setWorkerVacations(response.data.workerVacations || {});
        setProductionComments(response.data.productionComments || {});
      }
    } catch (error) {
      console.error('Error loading planning data:', error);
    }
  };

  const savePlanningData = async () => {
    try {
      await api.post('/planning/save', {
        salesData,
        productionData,
        disabledProductionDays,
        workerVacations,
        productionComments
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving planning data:', error);
    }
  };

  // Auto-save when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(salesData).length > 0 || Object.keys(productionData).length > 0) {
        savePlanningData();
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [salesData, productionData, disabledProductionDays, workerVacations, productionComments]);

  // Helper functions
  const updateSalesData = (productId, customerId, day, value, weekIndex = selectedWeek) => {
    const key = `${productId}-${customerId}-${weekIndex}-${day}`;
    setSalesData(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const updateProductionData = (productId, day, value, weekIndex = selectedWeek) => {
    const key = `${productId}-${weekIndex}-${day}`;
    setProductionData(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const getSalesTotal = (productId, day, week = selectedWeek) => {
    return customers.reduce((total, customer) => {
      const key = `${productId}-${customer.id}-${week}-${day}`;
      return total + (salesData[key] || 0);
    }, 0);
  };

  const getProductionValue = (productId, day, week = selectedWeek) => {
    const key = `${productId}-${week}-${day}`;
    return productionData[key] || 0;
  };

  const getCumulativeSales = (productId, upToDay, week = selectedWeek) => {
    let total = 0;
    const dayIndex = days.indexOf(upToDay);
    for (let i = 0; i <= dayIndex; i++) {
      total += getSalesTotal(productId, days[i], week);
    }
    return total;
  };

  const getCumulativeProduction = (productId, upToDay, week = selectedWeek) => {
    let total = 0;
    const dayIndex = days.indexOf(upToDay);
    for (let i = 0; i <= dayIndex; i++) {
      total += getProductionValue(productId, days[i], week);
    }
    return total;
  };

  const getRunningInventory = (productId, upToDay, currentWeek) => {
    let totalProduction = 0;
    let totalSales = 0;
    
    // Calculate for all weeks up to current week
    for (let w = 0; w <= currentWeek; w++) {
      if (w < currentWeek) {
        // For previous weeks, count all days
        days.forEach(day => {
          totalProduction += getProductionValue(productId, day, w);
          totalSales += getSalesTotal(productId, day, w);
        });
      } else {
        // For current week, count up to specified day
        const dayIndex = days.indexOf(upToDay);
        for (let d = 0; d <= dayIndex; d++) {
          totalProduction += getProductionValue(productId, days[d], w);
          totalSales += getSalesTotal(productId, days[d], w);
        }
      }
    }
    
    return totalProduction - totalSales;
  };

  const toggleProductionDay = (weekOffset, dayIndex) => {
    const key = `${weekOffset}-${dayIndex}`;
    const isCurrentlyDisabled = disabledProductionDays[key];
    
    setDisabledProductionDays(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // Update comments for weekends
    if (!isCurrentlyDisabled && (dayIndex === 5 || dayIndex === 6)) {
      const defaultComment = dayIndex === 5 ? 'Sobota' : 'Nedelja';
      setProductionComments(prev => ({
        ...prev,
        [key]: defaultComment
      }));
    } else if (isCurrentlyDisabled) {
      setProductionComments(prev => {
        const newComments = {...prev};
        delete newComments[key];
        return newComments;
      });
    }
  };

  const toggleWorkerVacation = (workerId, weekOffset, dayIndex) => {
    const key = `${workerId}-${weekOffset}-${dayIndex}`;
    setWorkerVacations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isWorkerOnVacation = (workerId, weekOffset, dayIndex) => {
    return workerVacations[`${workerId}-${weekOffset}-${dayIndex}`] || false;
  };

  const getAvailableWorkersCount = (weekOffset, dayIndex) => {
    return workers.filter(worker => 
      !isWorkerOnVacation(worker.id, weekOffset, dayIndex)
    ).length;
  };

  const updateProductionComment = (weekOffset, dayIndex, comment) => {
    const key = `${weekOffset}-${dayIndex}`;
    setProductionComments(prev => ({
      ...prev,
      [key]: comment
    }));
  };

  const value = {
    // Data
    products,
    customers,
    workers,
    salesData,
    productionData,
    disabledProductionDays,
    workerVacations,
    productionComments,
    
    // UI State
    selectedWeek,
    setSelectedWeek,
    viewLevel,
    setViewLevel,
    loading,
    lastSaved,
    weeks,
    days,
    
    // Functions
    updateSalesData,
    updateProductionData,
    getSalesTotal,
    getProductionValue,
    getCumulativeSales,
    getCumulativeProduction,
    getRunningInventory,
    toggleProductionDay,
    toggleWorkerVacation,
    isWorkerOnVacation,
    getAvailableWorkersCount,
    updateProductionComment,
    loadInitialData,
    savePlanningData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};