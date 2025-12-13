<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGoalPayment } from "~/composables/useGoalPayment";

const route = useRoute();
const router = useRouter();
const userId = route.params.userId as string;
const goalId = route.query.goal_id as string;
const categoryId = route.query.category_id as string;

const { clearPendingPayment } = useGoalPayment();

onMounted(async () => {
  // 決済がキャンセルされた場合、一時的な決済データをクリア
  if (goalId && categoryId) {
    try {
      await clearPendingPayment(userId, goalId, categoryId);
    } catch (error) {
      console.error("Error clearing pending payment:", error);
      // エラーが発生しても処理は続行
    }
  }
});
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
  >
    <div
      class="w-full max-w-md space-y-6 rounded-2xl bg-white p-10 text-center shadow-xl"
    >
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-400">
        <svg
          class="h-8 w-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-800">決済がキャンセルされました</h1>
      <p class="text-gray-600">
        決済がキャンセルされました。目標は編集可能なままです。
      </p>
      <button
        class="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
        @click="router.push(`/users/${userId}`)"
      >
        目標一覧に戻る
      </button>
    </div>
  </div>
</template>

