<script setup lang="ts">
import { ref, onMounted, defineComponent, h, type PropType } from "vue";
import { useRoute } from "vue-router";
import { useFireStore } from "~/composables/useFireStore";
import type { TodoDoc } from "../../../../@types/todoDoc";

// ルートパラメータからuserIdを取得
const route = useRoute();
const userId = route.params.userId as string;
const categoryId = "health"; // ハードコーディング

// Firestore composable
const { getAllGoalsWithSteps } = useFireStore();

// Todoの型定義
type TodoWithId = TodoDoc & {
  id: string;
};

// ステップの型定義
type StepWithChildren = {
  id: string;
  title: string;
  steps: StepWithChildren[];
  todos?: TodoWithId[];
};

type GoalWithSteps = {
  id: string;
  title: string;
  ratio: number;
  steps: StepWithChildren[];
  todos?: TodoWithId[];
};

// データ状態
const goals = ref<GoalWithSteps[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Firestoreからデータを取得
const fetchRoadmapData = async () => {
  try {
    loading.value = true;
    error.value = null;
    const data = await getAllGoalsWithSteps(userId, categoryId);
    goals.value = data;
  } catch (err: any) {
    console.error("Error fetching roadmap data:", err);
    error.value = err?.message || "ロードマップデータの取得に失敗しました";
  } finally {
    loading.value = false;
  }
};

// コンポーネントマウント時にデータを取得
onMounted(() => {
  fetchRoadmapData();
});

// ステップを再帰的に表示するコンポーネント
const RoadmapStep: ReturnType<typeof defineComponent> = defineComponent({
  name: "RoadmapStep",
  props: {
    step: {
      type: Object as PropType<StepWithChildren>,
      required: true,
    },
    level: {
      type: Number,
      default: 0,
    },
  },
  setup(props): () => ReturnType<typeof h> {
    return () => {
      const { step, level } = props;
      const indent = level * 24;

      return h(
        "div",
        {
          class: "step-item",
          style: {
            marginLeft: `${indent}px`,
            marginTop: level > 0 ? "8px" : "0",
            padding: "8px 12px",
            borderLeft: level > 0 ? "3px solid #d1d5db" : "none",
            backgroundColor: level === 0 ? "#f9fafb" : "transparent",
            borderRadius: "4px",
            transition: "background-color 0.2s",
          },
          onMouseenter: (e: MouseEvent) => {
            if (e.currentTarget) {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#f3f4f6";
            }
          },
          onMouseleave: (e: MouseEvent) => {
            if (e.currentTarget) {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                level === 0 ? "#f9fafb" : "transparent";
            }
          },
        },
        [
          h(
            "div",
            {
              class: "flex items-center",
            },
            [
              level > 0 &&
                h("div", {
                  class: "w-2 h-2 rounded-full bg-gray-400 mr-2",
                }),
              h("span", { class: "text-gray-800 font-medium" }, step.title),
            ],
          ),
          // todoを表示
          step.todos &&
          step.todos.length > 0 &&
          h(
            "div",
            {
              class: "mt-2 ml-4 space-y-1",
            },
            step.todos.map((todo: TodoWithId) =>
              h(
                "div",
                {
                  key: todo.id,
                  class: `text-sm px-2 py-1 rounded border-l-2 ${
                    todo.isFinished
                      ? "text-gray-500 bg-gray-50 border-gray-300 line-through"
                      : "text-gray-600 bg-blue-50 border-blue-300"
                  }`,
                },
                [
                  h(
                    "span",
                    { class: "font-semibold text-blue-700 mr-2" },
                    todo.isFinished ? "✓ DONE: " : "TODO: ",
                  ),
                  h("span", {}, todo.task),
                  todo.weight !== undefined &&
                    h(
                      "span",
                      { class: "ml-2 text-xs text-gray-500" },
                      `(重み: ${todo.weight})`,
                    ),
                ],
              ),
            ),
          ),
          step.steps &&
          step.steps.length > 0 &&
          h(
            "div",
            {
              class: "mt-2",
            },
            step.steps.map(
              (childStep: StepWithChildren): ReturnType<typeof h> =>
                h(RoadmapStep, {
                  key: childStep.id,
                  step: childStep,
                  level: level + 1,
                }),
            ),
          ),
        ],
      );
    };
  },
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">ロードマップ</h1>

    <!-- ローディング状態 -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <p class="mt-4 text-gray-600">読み込み中...</p>
    </div>

    <!-- エラー状態 -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      <p class="font-semibold">エラーが発生しました</p>
      <p>{{ error }}</p>
    </div>

    <!-- ロードマップ表示 -->
    <div v-else-if="goals.length > 0" class="space-y-8">
      <div
        v-for="goal in goals"
        :key="goal.id"
        class="goal-card bg-white rounded-lg shadow-md p-6"
      >
        <div class="goal-header mb-4 pb-4 border-b">
          <h2 class="text-2xl font-bold text-gray-900">{{ goal.title }}</h2>
          <div class="mt-2">
            <span class="text-sm text-gray-600">達成率: </span>
            <span class="font-semibold">{{ goal.ratio }}%</span>
          </div>
        </div>

        <!-- Goal配下のtodoを表示 -->
        <div v-if="goal.todos && goal.todos.length > 0" class="mb-4">
          <h3 class="text-lg font-semibold text-gray-700 mb-2">TODO</h3>
          <div class="space-y-1 ml-4">
            <div
              v-for="todo in goal.todos"
              :key="todo.id"
              :class="`text-sm px-3 py-2 rounded border-l-2 ${
                todo.isFinished
                  ? 'text-gray-500 bg-gray-50 border-gray-300 line-through'
                  : 'text-gray-600 bg-blue-50 border-blue-300'
              }`"
            >
              <span class="font-semibold text-blue-700 mr-2">
                {{ todo.isFinished ? "✓ DONE: " : "TODO: " }}
              </span>
              <span>{{ todo.task }}</span>
              <span
                v-if="todo.weight !== undefined"
                class="ml-2 text-xs text-gray-500"
              >
                (重み: {{ todo.weight }})
              </span>
            </div>
          </div>
        </div>

        <div class="steps-container">
          <h3 class="text-lg font-semibold text-gray-700 mb-4">ステップ</h3>
          <div v-if="goal.steps && goal.steps.length > 0" class="space-y-2">
            <component
              v-for="step in goal.steps"
              :key="step.id"
              :is="RoadmapStep"
              :step="step"
              :level="0"
            />
          </div>
          <p v-else class="text-gray-500 italic">ステップがありません</p>
        </div>
      </div>
    </div>

    <!-- データなし状態 -->
    <div v-else class="text-center py-12">
      <p class="text-gray-600">ロードマップデータがありません</p>
    </div>
  </div>
</template>


<style scoped>
.goal-card {
  transition: box-shadow 0.2s;
}

.goal-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.step-item {
  position: relative;
}
</style>
