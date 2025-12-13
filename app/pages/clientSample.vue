<script setup lang="ts">
import { ref } from "vue";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { getApp } from "firebase/app";

const userId = ref("");
const categoryId = ref("");
const goalId = ref("");
const loading = ref(false);
const error = ref("");
const jsonOutput = ref<string>("");

const exportJson = async () => {
  if (!userId.value || !categoryId.value || !goalId.value) {
    error.value = "userId、categoryId、goalIdをすべて入力してください";
    return;
  }

  loading.value = true;
  error.value = "";
  jsonOutput.value = "";

  try {
    const app = getApp();
    const functions = getFunctions(app, "asia-northeast1");
    
    // 開発環境ではエミュレーターに接続（getFunctionsを呼ぶたびに新しいインスタンスが作られるため、毎回接続が必要）
    if (process.env.NODE_ENV === "development") {
      try {
        connectFunctionsEmulator(functions, "localhost", 5001);
        console.log("エミュレーターに接続しました: localhost:5001");
      } catch (e: any) {
        // 既に接続されている場合は無視
        if (!e.message?.includes("already been called")) {
          console.warn("エミュレーター接続エラー:", e);
        }
      }
    }
    
    console.log("関数を呼び出します: api_fireStore_exportJson");
    const exportJsonFunction = httpsCallable(functions, "api_fireStore_exportJson");

    const result = await exportJsonFunction({
      userId: userId.value,
      categoryId: categoryId.value,
      goalId: goalId.value,
    });

    if (result.data && (result.data as any).success) {
      jsonOutput.value = JSON.stringify((result.data as any).data, null, 2);
    } else {
      error.value = "JSON出力に失敗しました";
    }
  } catch (err: any) {
    console.error("Export error:", err);
    if (err.code) {
      error.value = `エラーコード: ${err.code} - ${err.message || "エラーが発生しました"}`;
    } else {
      error.value = err?.message || "エラーが発生しました";
    }
    if (err.stack) {
      console.error("Stack trace:", err.stack);
    }
  } finally {
    loading.value = false;
  }
};

const downloadJson = () => {
  if (!jsonOutput.value) return;

  const blob = new Blob([jsonOutput.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `export_${userId.value}_${categoryId.value}_${goalId.value}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>

<template>
  <main class="min-h-screen p-8">
    <div class="max-w-4xl mx-auto">
      <h1
        class="text-center text-5xl font-extrabold text-red-600 transition hover:text-emerald-700 md:text-6xl mb-8"
      >
        Hello World
      </h1>
      <h2 class="text-center mb-8">deploy test</h2>

      <!-- JSON出力フォーム -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4">Firestore JSON出力</h2>
        
        <div class="space-y-4">
          <div>
            <label for="userId" class="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              id="userId"
              v-model="userId"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ユーザーIDを入力"
            />
          </div>

          <div>
            <label for="categoryId" class="block text-sm font-medium text-gray-700 mb-1">
              Category ID
            </label>
            <input
              id="categoryId"
              v-model="categoryId"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="カテゴリIDを入力"
            />
          </div>

          <div>
            <label for="goalId" class="block text-sm font-medium text-gray-700 mb-1">
              Goal ID
            </label>
            <input
              id="goalId"
              v-model="goalId"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="目標IDを入力"
            />
          </div>

          <button
            @click="exportJson"
            :disabled="loading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? "出力中..." : "JSON出力" }}
          </button>

          <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {{ error }}
          </div>

          <div v-if="jsonOutput" class="mt-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-lg font-semibold">出力結果</h3>
              <button
                @click="downloadJson"
                class="bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                ダウンロード
              </button>
            </div>
            <pre class="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">{{ jsonOutput }}</pre>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
