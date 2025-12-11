<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useFireStore } from "~/composables/useFireStore";
import CurrentBalance from "~/components/CurrentBalance.vue";
import StatusSummary from "~/components/StatusSummary.vue";
import NavigationButtons from "~/components/NavigationButtons.vue";

// ルートパラメータからuserIdを取得
const route = useRoute();
const userId = route.params.userId as string;

// Firestore composable
const { getCategoryRatio } = useFireStore();

// カテゴリの定義
const categories = [
  { id: "study", label: "Study", color: "#3B82F6", icon: "📖" },
  { id: "health", label: "Health", color: "#EF4444", icon: "💪" },
  { id: "work", label: "Work", color: "#A855F7", icon: "💼" },
  { id: "life", label: "Life", color: "#10B981", icon: "☀️" },
] as const;

// データ状態
const categoryRatios = ref<Record<string, number>>({});
const loading = ref(true);

// カテゴリ達成率を取得
const fetchCategoryRatios = async () => {
  try {
    loading.value = true;
    const ratios: Record<string, number> = {};

    for (const category of categories) {
      const ratio = await getCategoryRatio(userId, category.id);
      ratios[category.id] = ratio;
    }

    categoryRatios.value = ratios;
  } catch (error) {
    console.error("Error fetching category ratios:", error);
  } finally {
    loading.value = false;
  }
};

// コンポーネントマウント時にデータを取得
onMounted(() => {
  fetchCategoryRatios();
});
</script>

<template>
  <div class="container mx-auto max-w-2xl px-4 py-8">
    <!-- Header icons -->
    <div class="mb-6 flex justify-end gap-2">
      <NavigationButtons :user-id="userId" />
    </div>

    <!-- Current Balance Section -->
    <CurrentBalance :category-ratios="categoryRatios" />

    <!-- Status Summary Section -->
    <StatusSummary :category-ratios="categoryRatios" :loading="loading" />
  </div>
</template>
