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
const {
  getAllGoalsWithSteps,
  addStep,
  updateStep,
  deleteStep,
  addTodo,
  updateTodo,
  deleteTodo,
  addGoal,
  updateGoal,
  deleteGoal,
  calculateAndUpdateGoalRatio,
} = useFireStore();

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

// モーダル状態
const showStepModal = ref(false);
const showTodoModal = ref(false);
const showGoalModal = ref(false);
const editingStep = ref<{
  goalId: string;
  stepId?: string;
  stepPath: string[];
  title: string;
} | null>(null);
const editingTodo = ref<{
  goalId: string;
  todoId?: string;
  stepPath: string[];
  task: string;
  isFinished: boolean;
  weight?: number;
} | null>(null);
const editingGoal = ref<{
  goalId?: string;
  title: string;
} | null>(null);

// フォーム状態
const stepTitle = ref("");
const todoTask = ref("");
const todoIsFinished = ref(false);
const todoWeight = ref<number | undefined>(undefined);
const goalTitle = ref("");
const saving = ref(false);

// Firestoreからデータを取得
const fetchRoadmapData = async () => {
  try {
    loading.value = true;
    error.value = null;
    const data = await getAllGoalsWithSteps(userId, categoryId);
    // 新しい配列を作成してリアクティビティを確実にトリガー
    goals.value = [...data];
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

// ステップ追加・編集モーダルを開く
const openStepModal = (
  goalId: string,
  stepPath: string[] = [],
  stepId?: string,
  title?: string,
) => {
  editingStep.value = {
    goalId,
    stepId,
    stepPath,
    title: title || "",
  };
  stepTitle.value = title || "";
  showStepModal.value = true;
};

// ステップモーダルを閉じる
const closeStepModal = () => {
  showStepModal.value = false;
  editingStep.value = null;
  stepTitle.value = "";
};

// ステップを保存
const saveStep = async () => {
  if (!editingStep.value || !stepTitle.value.trim()) {
    return;
  }

  try {
    saving.value = true;
    if (editingStep.value.stepId) {
      // 更新
      await updateStep(
        userId,
        categoryId,
        editingStep.value.goalId,
        editingStep.value.stepId,
        { title: stepTitle.value },
        editingStep.value.stepPath,
      );
    } else {
      // 追加
      await addStep(
        userId,
        categoryId,
        editingStep.value.goalId,
        { title: stepTitle.value },
        editingStep.value.stepPath,
      );
    }
    closeStepModal();
    await fetchRoadmapData();
  } catch (err: any) {
    console.error("Error saving step:", err);
    error.value = err?.message || "ステップの保存に失敗しました";
  } finally {
    saving.value = false;
  }
};

// ステップを削除
const handleDeleteStep = async (
  goalId: string,
  stepId: string,
  stepPath: string[] = [],
) => {
  if (!confirm("このステップを削除しますか？")) {
    return;
  }

  try {
    await deleteStep(userId, categoryId, goalId, stepId, stepPath);
    await fetchRoadmapData();
  } catch (err: any) {
    console.error("Error deleting step:", err);
    error.value = err?.message || "ステップの削除に失敗しました";
  }
};

// タスク追加・編集モーダルを開く
const openTodoModal = (
  goalId: string,
  stepPath: string[] = [],
  todoId?: string,
  task?: string,
  isFinished?: boolean,
  weight?: number,
) => {
  editingTodo.value = {
    goalId,
    todoId,
    stepPath,
    task: task || "",
    isFinished: isFinished || false,
    weight,
  };
  todoTask.value = task || "";
  todoIsFinished.value = isFinished || false;
  todoWeight.value = weight;
  showTodoModal.value = true;
};

// タスクモーダルを閉じる
const closeTodoModal = () => {
  showTodoModal.value = false;
  editingTodo.value = null;
  todoTask.value = "";
  todoIsFinished.value = false;
  todoWeight.value = undefined;
};

// タスクを保存
const saveTodo = async () => {
  if (!editingTodo.value || !todoTask.value.trim()) {
    return;
  }

  try {
    saving.value = true;
    const todoData: TodoDoc = {
      task: todoTask.value,
      isFinished: todoIsFinished.value,
      weight: todoWeight.value,
    };

    if (editingTodo.value.todoId) {
      // 更新
      await updateTodo(
        userId,
        categoryId,
        editingTodo.value.goalId,
        editingTodo.value.todoId,
        todoData,
        editingTodo.value.stepPath,
      );
    } else {
      // 追加
      await addTodo(
        userId,
        categoryId,
        editingTodo.value.goalId,
        todoData,
        editingTodo.value.stepPath,
      );
    }
    closeTodoModal();
    await fetchRoadmapData();
  } catch (err: any) {
    console.error("Error saving todo:", err);
    error.value = err?.message || "タスクの保存に失敗しました";
  } finally {
    saving.value = false;
  }
};

// 目標を追加・編集モーダルを開く
const openGoalModal = (goalId?: string, title?: string) => {
  editingGoal.value = {
    goalId,
    title: title || "",
  };
  goalTitle.value = title || "";
  showGoalModal.value = true;
};

// 目標モーダルを閉じる
const closeGoalModal = () => {
  showGoalModal.value = false;
  editingGoal.value = null;
  goalTitle.value = "";
};

// 目標を保存
const saveGoal = async () => {
  if (!goalTitle.value.trim()) {
    return;
  }

  try {
    saving.value = true;
    if (editingGoal.value?.goalId) {
      // 更新
      await updateGoal(userId, categoryId, editingGoal.value.goalId, {
        title: goalTitle.value,
      });
    } else {
      // 追加
      await addGoal(userId, categoryId, {
        title: goalTitle.value,
        ratio: 0,
      });
    }
    closeGoalModal();
    await fetchRoadmapData();
  } catch (err: any) {
    console.error("Error saving goal:", err);
    error.value = err?.message || "目標の保存に失敗しました";
  } finally {
    saving.value = false;
  }
};

// 目標を削除
const handleDeleteGoal = async (goalId: string) => {
  if (!confirm("この目標を削除しますか？目標配下のすべてのステップとタスクも削除されます。")) {
    return;
  }

  try {
    saving.value = true;
    await deleteGoal(userId, categoryId, goalId);
    await fetchRoadmapData();
  } catch (err: any) {
    console.error("Error deleting goal:", err);
    error.value = err?.message || "目標の削除に失敗しました";
  } finally {
    saving.value = false;
  }
};

// todoの達成状態を切り替え
const toggleTodoCompletion = async (
  goalId: string,
  todoId: string,
  stepPath: string[],
  currentStatus: boolean,
) => {
  try {
    saving.value = true;
    await updateTodo(
      userId,
      categoryId,
      goalId,
      todoId,
      { isFinished: !currentStatus },
      stepPath,
    );

    // 達成率を再計算
    await calculateAndUpdateGoalRatio(userId, categoryId, goalId);

    // UIを更新
    const goal = goals.value.find((g) => g.id === goalId);
    if (goal) {
      if (stepPath.length === 0) {
        // Goal配下のtodo
        const todo = goal.todos?.find((t) => t.id === todoId);
        if (todo) {
          todo.isFinished = !currentStatus;
        }
      } else {
        // Step配下のtodo
        const findAndUpdateTodo = (
          steps: StepWithChildren[],
          path: string[],
        ): boolean => {
          if (path.length === 0) return false;
          const step = steps.find((s) => s.id === path[0]);
          if (!step) return false;
          if (path.length === 1) {
            const todo = step.todos?.find((t) => t.id === todoId);
            if (todo) {
              todo.isFinished = !currentStatus;
              return true;
            }
            return false;
          }
          return findAndUpdateTodo(step.steps, path.slice(1));
        };
        findAndUpdateTodo(goal.steps, stepPath);
      }
    }

    // バックグラウンドでデータを再取得
    setTimeout(async () => {
      try {
        await fetchRoadmapData();
      } catch (err) {
        console.error("Background refresh failed:", err);
      }
    }, 500);
  } catch (err: any) {
    console.error("Error toggling todo completion:", err);
    error.value = err?.message || "タスクの状態更新に失敗しました";
  } finally {
    saving.value = false;
  }
};

// タスクを削除
const handleDeleteTodo = async (
  goalId: string,
  todoId: string,
  stepPath: string[] = [],
) => {
  if (!confirm("このタスクを削除しますか？")) {
    return;
  }

  try {
    await deleteTodo(userId, categoryId, goalId, todoId, stepPath);
    
    // UIから直接削除（即座に反映）
    const goal = goals.value.find((g) => g.id === goalId);
    if (goal) {
      if (stepPath.length === 0) {
        // Goal配下のtodo
        if (goal.todos) {
          const index = goal.todos.findIndex((t) => t.id === todoId);
          if (index !== -1) {
            goal.todos.splice(index, 1);
            if (goal.todos.length === 0) {
              goal.todos = undefined;
            }
          } else {
            console.warn("Todo not found in goal todos:", todoId);
          }
        }
      } else {
        // Step配下のtodoを再帰的に検索して削除
        const removeTodoFromSteps = (steps: StepWithChildren[], path: string[]): boolean => {
          if (path.length === 0) {
            console.warn("Empty path when trying to remove todo from steps");
            return false;
          }
          const step = steps.find((s) => s.id === path[0]);
          if (!step) {
            console.warn("Step not found in path:", path[0]);
            return false;
          }
          if (path.length === 1) {
            // このステップのtodoを削除
            if (step.todos) {
              const index = step.todos.findIndex((t) => t.id === todoId);
              if (index !== -1) {
                step.todos.splice(index, 1);
                if (step.todos.length === 0) {
                  step.todos = undefined;
                }
                return true;
              } else {
                console.warn("Todo not found in step todos:", todoId, step.title);
              }
            } else {
              console.warn("Step has no todos:", step.title);
            }
            return false;
          }
          // 子ステップを再帰的に検索
          return removeTodoFromSteps(step.steps, path.slice(1));
        };
        const removed = removeTodoFromSteps(goal.steps, stepPath);
        if (!removed) {
          console.warn("Failed to remove todo from steps, path:", stepPath);
        }
      }
    } else {
      console.warn("Goal not found:", goalId);
    }
    
    // バックグラウンドでデータを再取得（確実にFirestoreと同期）
    setTimeout(async () => {
      try {
        await fetchRoadmapData();
      } catch (err) {
      }
    }, 500);
  } catch (err: any) {
    console.error("Error deleting todo:", err);
    error.value = err?.message || "タスクの削除に失敗しました";
  }
};

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
    goalId: {
      type: String,
      required: true,
    },
    stepPath: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    onEditStep: {
      type: Function as PropType<
        (goalId: string, stepPath: string[], stepId: string, title: string) => void
      >,
      required: true,
    },
    onDeleteStep: {
      type: Function as PropType<
        (goalId: string, stepId: string, stepPath: string[]) => void
      >,
      required: true,
    },
    onAddSubStep: {
      type: Function as PropType<
        (goalId: string, stepPath: string[]) => void
      >,
      required: true,
    },
    onAddTodo: {
      type: Function as PropType<
        (goalId: string, stepPath: string[]) => void
      >,
      required: true,
    },
    onEditTodo: {
      type: Function as PropType<
        (
          goalId: string,
          stepPath: string[],
          todoId: string,
          task: string,
          isFinished: boolean,
          weight?: number,
        ) => void
      >,
      required: true,
    },
    onDeleteTodo: {
      type: Function as PropType<
        (goalId: string, todoId: string, stepPath: string[]) => void
      >,
      required: true,
    },
  },
  setup(props): () => ReturnType<typeof h> {
    return () => {
      const {
        step,
        level,
        goalId,
        stepPath,
        onEditStep,
        onDeleteStep,
        onAddSubStep,
        onAddTodo,
        onEditTodo,
        onDeleteTodo,
      } = props;
      const indent = level * 24;
      const currentStepPath = [...stepPath, step.id];

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
              class: "flex items-center justify-between group",
            },
            [
              h(
                "div",
                { class: "flex items-center flex-1" },
                [
                  level > 0 &&
                    h("div", {
                      class: "w-2 h-2 rounded-full bg-gray-400 mr-2",
                    }),
                  h("span", { class: "text-gray-800 font-medium" }, step.title),
                ],
              ),
              h(
                "div",
                { class: "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" },
                [
                  h(
                    "button",
                    {
                      class: "text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600",
                      onClick: () => onAddSubStep(goalId, currentStepPath),
                    },
                    "+ ステップ",
                  ),
                  h(
                    "button",
                    {
                      class: "text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600",
                      onClick: () => onAddTodo(goalId, currentStepPath),
                    },
                    "+ TODO",
                  ),
                  h(
                    "button",
                    {
                      class: "text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600",
                      onClick: () => onEditStep(goalId, stepPath, step.id, step.title),
                    },
                    "編集",
                  ),
                  h(
                    "button",
                    {
                      class: "text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600",
                      onClick: () => onDeleteStep(goalId, step.id, stepPath),
                    },
                    "削除",
                  ),
                ],
              ),
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
                  class: `text-sm px-2 py-1 rounded border-l-2 flex items-center justify-between group ${
                    todo.isFinished
                      ? "text-gray-500 bg-gray-50 border-gray-300 line-through"
                      : "text-gray-600 bg-blue-50 border-blue-300"
                  }`,
                },
                [
                  h(
                    "div",
                    { class: "flex items-center flex-1" },
                    [
                      h(
                        "button",
                        {
                          class: `mr-2 px-2 py-1 text-xs rounded ${
                            todo.isFinished
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                          }`,
                          onClick: () =>
                            toggleTodoCompletion(
                              goalId,
                              todo.id,
                              currentStepPath,
                              todo.isFinished,
                            ),
                        },
                        todo.isFinished ? "✓ 完了" : "未完了",
                      ),
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
                  h(
                    "div",
                    { class: "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" },
                    [
                      h(
                        "button",
                        {
                          class: "text-xs px-1 py-0.5 bg-yellow-500 text-white rounded hover:bg-yellow-600",
                          onClick: () =>
                            onEditTodo(
                              goalId,
                              stepPath,
                              todo.id,
                              todo.task,
                              todo.isFinished,
                              todo.weight,
                            ),
                        },
                        "編集",
                      ),
                      h(
                        "button",
                        {
                          class: "text-xs px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600",
                          onClick: () => onDeleteTodo(goalId, todo.id, currentStepPath),
                        },
                        "削除",
                      ),
                    ],
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
                  goalId,
                  stepPath: currentStepPath,
                  onEditStep,
                  onDeleteStep,
                  onAddSubStep,
                  onAddTodo,
                  onEditTodo,
                  onDeleteTodo,
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
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">ロードマップ</h1>
      <button
        @click="() => openGoalModal()"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + 目標を追加
      </button>
    </div>

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
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">{{ goal.title }}</h2>
              <div class="mt-2">
                <span class="text-sm text-gray-600">達成率: </span>
                <span class="font-semibold">{{ goal.ratio }}%</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="openGoalModal(goal.id, goal.title)"
                class="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                編集
              </button>
              <button
                @click="handleDeleteGoal(goal.id)"
                class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                :disabled="saving"
              >
                削除
              </button>
            </div>
          </div>
        </div>

        <!-- Goal配下のtodoを表示 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-gray-700">TODO</h3>
            <button
              @click="openTodoModal(goal.id)"
              class="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              + TODO追加
            </button>
          </div>
          <div v-if="goal.todos && goal.todos.length > 0" class="space-y-1 ml-4">
            <div
              v-for="todo in goal.todos"
              :key="todo.id"
              :class="`text-sm px-3 py-2 rounded border-l-2 flex items-center justify-between group ${
                todo.isFinished
                  ? 'text-gray-500 bg-gray-50 border-gray-300 line-through'
                  : 'text-gray-600 bg-blue-50 border-blue-300'
              }`"
            >
              <div class="flex items-center">
                <button
                  @click="toggleTodoCompletion(goal.id, todo.id, [], todo.isFinished)"
                  :class="`mr-2 px-2 py-1 text-xs rounded ${
                    todo.isFinished
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`"
                  :disabled="saving"
                >
                  {{ todo.isFinished ? "✓ 完了" : "未完了" }}
                </button>
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
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click="
                    openTodoModal(
                      goal.id,
                      [],
                      todo.id,
                      todo.task,
                      todo.isFinished,
                      todo.weight,
                    )
                  "
                  class="text-xs px-1 py-0.5 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  編集
                </button>
                <button
                  @click="handleDeleteTodo(goal.id, todo.id, [])"
                  class="text-xs px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-gray-500 italic ml-4">TODOがありません</p>
        </div>

        <div class="steps-container">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-700">ステップ</h3>
            <button
              @click="openStepModal(goal.id)"
              class="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + ステップ追加
            </button>
          </div>
          <div v-if="goal.steps && goal.steps.length > 0" class="space-y-2">
            <component
              v-for="step in goal.steps"
              :key="step.id"
              :is="RoadmapStep"
              :step="step"
              :level="0"
              :goal-id="goal.id"
              :step-path="[]"
              :on-edit-step="
                (gId: string, sPath: string[], sId: string, title: string) =>
                  openStepModal(gId, sPath, sId, title)
              "
              :on-delete-step="handleDeleteStep"
              :on-add-sub-step="(gId: string, sPath: string[]) => openStepModal(gId, sPath)"
              :on-add-todo="(gId: string, sPath: string[]) => openTodoModal(gId, sPath)"
              :on-edit-todo="
                (gId: string, sPath: string[], tId: string, task: string, finished: boolean, weight?: number) =>
                  openTodoModal(gId, sPath, tId, task, finished, weight)
              "
              :on-delete-todo="handleDeleteTodo"
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

    <!-- ステップ追加・編集モーダル -->
    <div
      v-if="showStepModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeStepModal"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">
          {{ editingStep?.stepId ? "ステップを編集" : "ステップを追加" }}
        </h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            タイトル
          </label>
          <input
            v-model="stepTitle"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ステップのタイトルを入力"
          />
        </div>
        <div class="flex gap-3 justify-end">
          <button
            @click="closeStepModal"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            :disabled="saving"
          >
            キャンセル
          </button>
          <button
            @click="saveStep"
            class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            :disabled="saving || !stepTitle.trim()"
          >
            {{ saving ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 目標追加・編集モーダル -->
    <div
      v-if="showGoalModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeGoalModal"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">
          {{ editingGoal?.goalId ? "目標を編集" : "目標を追加" }}
        </h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            タイトル
          </label>
          <input
            v-model="goalTitle"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="目標のタイトルを入力"
          />
        </div>
        <div class="flex gap-3 justify-end">
          <button
            @click="closeGoalModal"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            :disabled="saving"
          >
            キャンセル
          </button>
          <button
            @click="saveGoal"
            class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            :disabled="saving || !goalTitle.trim()"
          >
            {{ saving ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
    </div>

    <!-- タスク追加・編集モーダル -->
    <div
      v-if="showTodoModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeTodoModal"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">
          {{ editingTodo?.todoId ? "タスクを編集" : "タスクを追加" }}
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              タスク
            </label>
            <input
              v-model="todoTask"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="タスクを入力"
            />
          </div>
          <div>
            <label class="flex items-center">
              <input
                v-model="todoIsFinished"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm font-medium text-gray-700">完了済み</span>
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              重み（オプション）
            </label>
            <input
              v-model.number="todoWeight"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="重みを入力"
            />
          </div>
        </div>
        <div class="flex gap-3 justify-end mt-6">
          <button
            @click="closeTodoModal"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            :disabled="saving"
          >
            キャンセル
          </button>
          <button
            @click="saveTodo"
            class="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
            :disabled="saving || !todoTask.trim()"
          >
            {{ saving ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
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
