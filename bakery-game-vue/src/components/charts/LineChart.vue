<template>
  <div class="chart-container" :style="{ height: height }">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
    fill?: boolean;
  }[];
  height?: string;
  showLegend?: boolean;
  yAxisLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  showLegend: true,
});

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.data,
    borderColor: dataset.color || `hsl(${index * 60}, 70%, 50%)`,
    backgroundColor: dataset.fill 
      ? `${dataset.color || `hsl(${index * 60}, 70%, 50%)`}33`
      : 'transparent',
    fill: dataset.fill || false,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 5,
    borderWidth: 2,
  })),
}));

const chartOptions = computed<ChartOptions<'line'>>(() => ({
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
            label += new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(context.parsed.y);
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
