<script setup lang="ts">

import { ref, computed, watch } from 'vue';
import { Radar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

const props = defineProps<{
  chartData?: {
    progress: number[];
    labels: string[];
  };
}>();

const summary = computed(() => props.chartData || {
  progress: [1, 1, 1],
  labels: ['','',''],
});

const chartData = computed(() => ({
  labels: summary.value.labels ?? [],
  datasets: [
    {
      label: 'Dataset',
      data: summary.value.progress ?? [],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      pointBackgroundColor: 'rgba(54, 162, 235, 1)',
    },
  ],
}));

const config = {
  type: 'radar',
  options: {
    elements: {
      line: {
        borderWidth: 3
      }
    }
  },
};
</script>

<template>
  <Radar :data="chartData" :options="config.options" />
</template>