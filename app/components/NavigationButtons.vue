<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps<{
  userId: string;
}>();

const route = useRoute();
const router = useRouter();

// 現在のページパスを取得
const currentPath = computed(() => route.path);

// ロードマップページかどうか
const isRoadmapPage = computed(() => {
  return currentPath.value === `/users/${props.userId}`;
});

// 分析ページかどうか
const isAnalyzePage = computed(() => {
  return currentPath.value === `/users/${props.userId}/analyze`;
});

// ナビゲーション
const navigateToRoadmap = () => {
  router.push(`/users/${props.userId}`);
};

const navigateToAnalyze = () => {
  router.push(`/users/${props.userId}/analyze`);
};
</script>

<template>
  <div class="flex gap-2">
    <button
      @click="navigateToRoadmap"
      :class="`w-8 h-8 rounded flex items-center justify-center transition-colors ${
        isRoadmapPage
          ? 'bg-purple-500 hover:bg-purple-600'
          : 'bg-gray-200 hover:bg-gray-300'
      }`"
      :title="'ロードマップ'"
    >
      <svg
        :class="`w-5 h-5 ${
          isRoadmapPage ? 'text-white' : 'text-gray-600'
        }`"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </button>
    <button
      @click="navigateToAnalyze"
      :class="`w-8 h-8 rounded flex items-center justify-center transition-colors ${
        isAnalyzePage
          ? 'bg-purple-500 hover:bg-purple-600'
          : 'bg-gray-200 hover:bg-gray-300'
      }`"
      :title="'分析'"
    >
      <svg
        :class="`w-5 h-5 ${
          isAnalyzePage ? 'text-white' : 'text-gray-600'
        }`"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </button>
  </div>
</template>

