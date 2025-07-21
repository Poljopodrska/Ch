import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useApp } from '../../contexts/AppContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProductionEfficiencyChart = () => {
  const { products, days, getSalesTotal, getProductionValue } = useApp();
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Calculate efficiency for each product
    const productNames = products.slice(0, 5).map(p => p.name); // Show top 5 products
    const efficiencyData = products.slice(0, 5).map(product => {
      const totalSales = days.reduce((sum, day) => sum + getSalesTotal(product.id, day, 0), 0);
      const totalProduction = days.reduce((sum, day) => sum + getProductionValue(product.id, day, 0), 0);
      
      if (totalSales === 0) return 0;
      return Math.min(100, (totalProduction / totalSales) * 100);
    });

    setChartData({
      labels: productNames,
      datasets: [
        {
          label: 'Pokritost (%)',
          data: efficiencyData,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
        },
      ],
    });
  }, [products, days, getSalesTotal, getProductionValue]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Pokritost prodaje (%)',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  if (!chartData) {
    return <div className="h-64 flex items-center justify-center">Nalaganje...</div>;
  }

  return <Bar options={options} data={chartData} />;
};

export default ProductionEfficiencyChart;