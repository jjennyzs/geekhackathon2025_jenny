<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Radar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { useFireStore } from "#imports";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
);

const { getCategoryRatio } = useFireStore();

const route = useRoute();
const userId = route.params.userId as string;

// カテゴリの定義
const categories = [
  { id: "study", label: "Study", color: "#3B82F6", icon: "📖" },
  { id: "health", label: "Health", color: "#EF4444", icon: "💪" },
  { id: "work", label: "Work", color: "#A855F7", icon: "💼" },
  { id: "life", label: "Life", color: "#10B981", icon: "☀️" },
] as const;

const props = defineProps<{
  chartData?: {
    progress: number[];
    labels: string[];
  };
}>();

// カテゴリのratioを取得してprogressに格納
const progress = ref<number[]>([]);
const labels = ref<string[]>([]);

// カテゴリのratioを取得
const fetchCategoryRatios = async () => {
  try {
    const ratios: number[] = [];
    const categoryLabels: string[] = [];

    for (const category of categories) {
      const ratio = await getCategoryRatio(userId, category.id);
      ratios.push(ratio);
      categoryLabels.push(category.label);
    }

    progress.value = ratios;
    labels.value = categoryLabels;
  } catch (error) {
    console.error("Error fetching category ratios:", error);
    // エラー時はデフォルト値を設定
    progress.value = props.chartData?.progress ?? [0, 0, 0, 0];
    labels.value = props.chartData?.labels ?? categories.map((c) => c.label);
  }
};

// コンポーネントマウント時にデータを取得
onMounted(() => {
  fetchCategoryRatios();
});

const chartData = computed(() => ({
  labels:
    labels.value.length > 0
      ? labels.value
      : (props.chartData?.labels ?? categories.map((c) => c.label)),
  datasets: [
    {
      label: "達成率",
      data:
        progress.value.length > 0
          ? progress.value
          : (props.chartData?.progress ?? [0, 0, 0, 0]),
      backgroundColor: "rgba(54, 162, 235, 0.2)",
      borderColor: "rgba(54, 162, 235, 1)",
      pointBackgroundColor: "rgba(54, 162, 235, 1)",
    },
  ],
}));

const config = {
  type: "radar",
  options: {
    plugins: {
      legend: {
        display: false,
      },
    },
    elements: {
      line: {
        borderWidth: 3,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  },
};
</script>

<template>
  <div class="flex flex-col items-center">
    <p class="mb-6 text-center text-2xl font-bold text-gray-800">達成率</p>
    <Radar :data="chartData" :options="config.options" />
  </div>
</template>
