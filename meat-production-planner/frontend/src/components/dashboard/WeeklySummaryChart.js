import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useApp } from '../../contexts/AppContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeeklySummaryChart = () => {
  const { products, days, getSalesTotal, getProductionValue } = useApp();
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Calculate daily totals for current week
    const salesData = days.map(day => 
      products.reduce((total, product) => total + getSalesTotal(product.id, day, 0), 0)
    );
    
    const productionData = days.map(day => 
      products.reduce((total, product) => total + getProductionValue(product.id, day, 0), 0)
    );

    setChartData({
      labels: days,
      datasets: [
        {
          label: 'Prodaja',
          data: salesData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.1,
        },
        {
          label: 'Proizvodnja',
          data: productionData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.1,
        },
      ],
    });
  }, [products, days, getSalesTotal, getProductionValue]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Količina (kg)',
        },
      },
    },
  };

  if (!chartData) {
    return <div className="h-64 flex items-center justify-center">Nalaganje...</div>;
  }

  return <Line options={options} data={chartData} />;
};

export default WeeklySummaryChart;