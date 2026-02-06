<template>
  <div class="chart-container" :style="{ height: height }">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  labels: string[];
  data: number[];
  height?: string;
  showLegend?: boolean;
  doughnut?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  showLegend: true,
  doughnut: true,
});

const bakeryColors = [
  '#d97706', // bakery-gold-600
  '#92400e', // bakery-brown-700
  '#f59e0b', // bakery-gold-500
  '#78350f', // bakery-brown-800
  '#fbbf24', // bakery-gold-400
  '#b45309', // bakery-gold-700
  '#fde68a', // bakery-gold-200
  '#451a03', // bakery-brown-950
];

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      backgroundColor: bakeryColors.slice(0, props.data.length),
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 10,
    },
  ],
}));

const chartOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: props.doughnut ? '60%' : '0%',
  plugins: {
    legend: {
      display: props.showLegend,
      position: 'right',
      labels: {
        color: '#78350f',
        font: {
          family: 'Inter, sans-serif',
          size: 12,
        },
        usePointStyle: true,
        padding: 15,
        generateLabels: (chart) => {
          const data = chart.data;
          if (data.labels && data.datasets.length) {
            const dataset = data.datasets[0];
            const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
            
            return data.labels.map((label, i) => {
              const value = (dataset.data as number[])[i];
              const percentage = ((value / total) * 100).toFixed(1);
              
              return {
                text: `${label}: ${percentage}%`,
                fillStyle: (dataset.backgroundColor as string[])[i],
                hidden: false,
                index: i,
              };
            });
          }
          return [];
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#78350f',
      bodyColor: '#78350f',
      borderColor: '#d97706',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((a: number, b) => a + (b as number), 0);
          const percentage = ((value / total) * 100).toFixed(1);
          
          return `${label}: ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(value)} (${percentage}%)`;
        },
      },
    },
  },
}));
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}
</style>
