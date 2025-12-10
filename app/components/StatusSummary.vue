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
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Status Summary</h2>
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <p class="mt-4 text-gray-600">読み込み中...</p>
    </div>
    <div v-else class="grid grid-cols-2 gap-4">
      <div
        v-for="category in categories"
        :key="category.id"
        class="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex-shrink-0"
            :style="{ color: category.color }"
          >
            <div class="text-4xl">{{ category.icon }}</div>
          </div>
          <div class="flex-1">
            <h3
              class="text-base font-medium mb-1"
              :style="{ color: category.color }"
            >
              {{ category.label }}
            </h3>
            <p class="text-3xl font-bold text-gray-800">
              {{ categoryRatios[category.id] || 0 }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

