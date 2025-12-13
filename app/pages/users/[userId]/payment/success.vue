<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGoalPayment } from "~/composables/useGoalPayment";

const route = useRoute();
const router = useRouter();
const userId = route.params.userId as string;
const sessionId = route.query.session_id as string;
const goalId = route.query.goal_id as string;
const categoryId = route.query.category_id as string;

const { verifyAndLockGoal } = useGoalPayment();
const isProcessing = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  if (!sessionId || !goalId || !categoryId) {
    error.value = "必要なパラメータが不足しています";
    isProcessing.value = false;
    return;
  }

  try {
    // 決済を確認して目標をロック
    await verifyAndLockGoal(userId, goalId, categoryId, sessionId);
    isProcessing.value = false;
    
    // 3秒後に目標一覧ページにリダイレクト
    setTimeout(() => {
      router.push(`/users/${userId}`);
    }, 3000);
  } catch (err: any) {
    console.error("Error verifying payment:", err);
    error.value = err.message || "決済の確認に失敗しました";
    isProcessing.value = false;
  }
});
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100"
  >
    <div
      class="w-full max-w-md space-y-6 rounded-2xl bg-white p-10 text-center shadow-xl"
    >
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
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
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div v-if="isProcessing" class="space-y-4">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <h1 class="text-2xl font-bold text-gray-800">決済を確認中...</h1>
        <p class="text-gray-600">目標をロックしています</p>
      </div>
      <div v-else-if="error" class="space-y-4">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
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
        <h1 class="text-2xl font-bold text-gray-800">エラーが発生しました</h1>
        <p class="text-red-600">{{ error }}</p>
      </div>
      <div v-else class="space-y-4">
        <h1 class="text-2xl font-bold text-gray-800">決済が完了しました</h1>
        <p class="text-gray-600">
          目標達成への賭けが確定しました。目標は編集できなくなりました。
        </p>
        <p class="text-sm text-gray-500">
          3秒後に目標一覧ページに戻ります...
        </p>
      </div>
      <button
        class="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
        @click="router.push(`/users/${userId}`)"
      >
        目標一覧に戻る
      </button>
    </div>
  </div>
</template>

