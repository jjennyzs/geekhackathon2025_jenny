<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

// ページ読み込み時に自動でログインページに遷移
router.push("/login");
</script>

<template>
  <main class="grid min-h-screen place-items-center">
    <p class="text-gray-600">リダイレクト中...</p>
  </main>
</template>
