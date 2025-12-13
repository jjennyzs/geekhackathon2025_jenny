<script setup lang="ts">
// Props
const props = defineProps<{
  categoryRatios: Record<string, number>;
  loading: boolean;
}>();

// カテゴリの定義
const categories = [
  { id: "study", label: "Study", color: "#3B82F6", icon: "📖" },
  { id: "health", label: "Health", color: "#EF4444", icon: "💪" },
  { id: "work", label: "Work", color: "#A855F7", icon: "💼" },
  { id: "life", label: "Life", color: "#10B981", icon: "☀️" },
] as const;
</script>

<template>
  <div>
    <h2 class="mb-4 text-xl font-semibold text-gray-800">Status Summary</h2>
    <div v-if="props.loading" class="py-8 text-center">
      <div
        class="inline-block size-8 animate-spin rounded-full border-b-2 border-gray-900"
      ></div>
      <p class="mt-4 text-gray-600">読み込み中...</p>
    </div>
    <div v-else class="grid grid-cols-2 gap-4">
      <div
        v-for="category in categories"
        :key="category.id"
        class="rounded-lg border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div class="flex items-center gap-4">
          <div class="shrink-0" :style="{ color: category.color }">
            <div class="text-4xl">{{ category.icon }}</div>
          </div>
          <div class="flex-1">
            <h3
              class="mb-1 text-base font-medium"
              :style="{ color: category.color }"
            >
              {{ category.label }}
            </h3>
            <p class="text-3xl font-bold text-gray-800">
              {{ props.categoryRatios[category.id] || 0 }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
