<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";

// Props
const props = defineProps<{
  categoryRatios: Record<string, number>;
}>();

// カテゴリの定義
const categories = [
  { id: "study", label: "Study", color: "#3B82F6" },
  { id: "health", label: "Health", color: "#EF4444" },
  { id: "life", label: "Life", color: "#10B981" },
  { id: "work", label: "Work", color: "#A855F7" },
] as const;

// レーダーチャートのデータポイント（0-100の値を0-1に正規化）
const chartData = computed(() => {
  const data: number[] = [];
  const labels: string[] = [];
  const colors: string[] = [];

  // Study, Health, Life, Workの順で配置
  const order = ["study", "health", "life", "work"];
  order.forEach((categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      labels.push(category.label);
      colors.push(category.color);
      data.push(props.categoryRatios[categoryId] || 0);
    }
  });

  return { data, labels, colors };
});

// レーダーチャートの描画
const canvasRef = ref<HTMLCanvasElement | null>(null);
const drawRadarChart = () => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2 - 40;
  const numAxes = chartData.value.data.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // グリッド線を描画（同心円）
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // 軸線を描画
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 1;
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // ラベルを描画
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = radius + 25;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;

    const color = chartData.value.colors[i];
    const label = chartData.value.labels[i];
    if (color && label) {
      ctx.fillStyle = color;
      ctx.fillText(label, x, y);
    }
  }

  // データポイントを描画
  ctx.fillStyle = "#A855F7";
  ctx.strokeStyle = "#7C3AED";
  ctx.lineWidth = 2;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numAxes; i++) {
    const value = (chartData.value.data[i] || 0) / 100; // 0-100を0-1に正規化
    const angle = i * angleStep - Math.PI / 2;
    const distance = radius * value;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    points.push({ x, y });

    // データポイントの円を描画
    const pointColor = chartData.value.colors[i];
    if (pointColor) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = pointColor;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // ポリゴンを描画
  if (points.length > 0) {
    ctx.fillStyle = "rgba(168, 85, 247, 0.3)";
    ctx.strokeStyle = "#7C3AED";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(points[0]?.x || 0, points[0]?.y || 0);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (point) {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
};

// コンポーネントマウント時とデータ更新時にチャートを描画
onMounted(() => {
  setTimeout(() => {
    drawRadarChart();
  }, 100);
});

// categoryRatiosが更新されたらチャートを再描画
watch(
  () => props.categoryRatios,
  () => {
    setTimeout(() => {
      drawRadarChart();
    }, 100);
  },
  { deep: true },
);
</script>

<template>
  <div class="mb-8">
    <h2 class="mb-4 text-xl font-semibold text-gray-800">Current Balance</h2>
    <div class="rounded-lg bg-purple-50 p-6">
      <canvas
        ref="canvasRef"
        width="400"
        height="400"
        class="mx-auto w-full max-w-md"
      />
    </div>
  </div>
</template>

<style scoped>
canvas {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
