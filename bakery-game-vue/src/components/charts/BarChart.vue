<template>
  <div class="chart-container" :style="{ height: height }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
  height?: string;
  showLegend?: boolean;
  horizontal?: boolean;
  yAxisLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  showLegend: true,
  horizontal: false,
});

const bakeryColors = [
  '#d97706', // bakery-gold-600
  '#92400e', // bakery-brown-700
  '#f59e0b', // bakery-gold-500
  '#78350f', // bakery-brown-800
  '#fbbf24', // bakery-gold-400
];

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: dataset.color || bakeryColors[index % bakeryColors.length],
    borderColor: dataset.color || bakeryColors[index % bakeryColors.length],
    borderWidth: 1,
    borderRadius: 4,
  })),
}));

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  indexAxis: props.horizontal ? 'y' : 'x',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: props.showLegend,
      position: 'top',
      labels: {
        color: '#78350f',
        font: {
          family: 'Inter, sans-serif',
          size: 12,
        },
        usePointStyle: true,
        padding: 15,
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
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            const value = props.horizontal ? context.parsed.x : context.parsed.y;
            label += new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(value);
          }
          return label;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(120, 53, 15, 0.1)',
      },
      ticks: {
        color: '#78350f',
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(120, 53, 15, 0.1)',
      },
      ticks: {
        color: '#78350f',
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
        callback: (value) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
          }).format(value as number);
        },
      },
      title: {
        display: !!props.yAxisLabel,
        text: props.yAxisLabel || '',
        color: '#78350f',
        font: {
          family: 'Inter, sans-serif',
          size: 12,
          weight: 'bold',
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
