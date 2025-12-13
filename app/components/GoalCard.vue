<script setup lang="ts">
import { defineComponent, h, type PropType, ref } from "vue";
import { useRoute } from "vue-router";
import type { TodoDoc } from "../../@types/todoDoc";
import { useGoalPayment } from "~/composables/useGoalPayment";

// RoadmapStepコンポーネント（簡略版、後で別ファイルに分けることも可能）

// 型定義
type TodoWithId = TodoDoc & {
  id: string;
};

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
  betAmount?: number;
  isLocked?: boolean;
  paymentIntentId?: string;
};

// Props
const props = defineProps<{
  goal: GoalWithSteps;
  saving: boolean;
  categoryId: string;
}>();

// Route
const route = useRoute();
const userId = route.params.userId as string;

// Payment composable
const { createGoalPaymentSession } = useGoalPayment();

// 賭け金入力モーダルの状態
const showBetModal = ref(false);
const betAmount = ref<number>(1000);
const isProcessingPayment = ref(false);

// 賭けるボタンのクリックハンドラー
const handleBetClick = () => {
  if (props.goal.isLocked) {
    return;
  }
  showBetModal.value = true;
};

// 決済セッションを作成してリダイレクト
const proceedToPayment = async () => {
  if (!betAmount.value || betAmount.value <= 0) {
    alert("金額を正しく入力してください");
    return;
  }

  try {
    isProcessingPayment.value = true;
    const url = await createGoalPaymentSession(
      userId,
      props.goal.id,
      props.categoryId,
      betAmount.value,
    );
    // Stripe決済ページにリダイレクト
    window.location.href = url;
  } catch (error: any) {
    console.error("Error creating payment session:", error);
    alert(`決済セッションの作成に失敗しました: ${error.message}`);
    isProcessingPayment.value = false;
  }
};

// Emits
const emit = defineEmits<{
  (e: "edit-goal", goalId: string, title: string): void;
  (e: "delete-goal", goalId: string): void;
  (e: "add-step", goalId: string): void;
  (e: "add-todo", goalId: string): void;
  (
    e: "edit-todo",
    goalId: string,
    todoId: string,
    task: string,
    isFinished: boolean,
    weight?: number,
  ): void;
  (e: "delete-todo", goalId: string, todoId: string): void;
  (
    e: "toggle-todo",
    goalId: string,
    todoId: string,
    currentStatus: boolean,
  ): void;
  (
    e: "edit-step",
    goalId: string,
    stepPath: string[],
    stepId: string,
    title: string,
  ): void;
  (e: "delete-step", goalId: string, stepPath: string[], stepId: string): void;
  (e: "add-sub-step", goalId: string, stepPath: string[]): void;
  (e: "add-todo-to-step", goalId: string, stepPath: string[]): void;
  (
    e: "edit-todo-in-step",
    goalId: string,
    stepPath: string[],
    todoId: string,
    task: string,
    isFinished: boolean,
    weight?: number,
  ): void;
  (
    e: "delete-todo-in-step",
    goalId: string,
    stepPath: string[],
    todoId: string,
  ): void;
  (
    e: "toggle-todo-in-step",
    goalId: string,
    stepPath: string[],
    todoId: string,
    currentStatus: boolean,
  ): void;
}>();

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
    isGoalLocked: {
      type: Boolean,
      default: false,
    },
    onEditStep: {
      type: Function as PropType<
        (
          goalId: string,
          stepPath: string[],
          stepId: string,
          title: string,
        ) => void
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
      type: Function as PropType<(goalId: string, stepPath: string[]) => void>,
      required: true,
    },
    onAddTodo: {
      type: Function as PropType<(goalId: string, stepPath: string[]) => void>,
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
    onToggleTodo: {
      type: Function as PropType<
        (
          goalId: string,
          stepPath: string[],
          todoId: string,
          currentStatus: boolean,
        ) => void
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
        isGoalLocked,
        onEditStep,
        onDeleteStep,
        onAddSubStep,
        onAddTodo,
        onEditTodo,
        onDeleteTodo,
        onToggleTodo,
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
        },
        [
          h(
            "div",
            {
              class: "flex items-center justify-between group",
            },
            [
              h("div", { class: "flex items-center flex-1" }, [
                level > 0 &&
                  h("div", {
                    class: "w-2 h-2 rounded-full bg-gray-400 mr-2",
                  }),
                h("span", { class: "text-gray-800 font-medium" }, step.title),
              ]),
              !isGoalLocked &&
                h(
                  "div",
                  {
                    class:
                      "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                  },
                  [
                    h(
                      "button",
                      {
                        class:
                          "text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600",
                        onClick: () => onAddSubStep(goalId, currentStepPath),
                      },
                      "+ ステップ",
                    ),
                    h(
                      "button",
                      {
                        class:
                          "text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600",
                        onClick: () => onAddTodo(goalId, currentStepPath),
                      },
                      "+ TODO",
                    ),
                    h(
                      "button",
                      {
                        class:
                          "text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600",
                        onClick: () =>
                          onEditStep(goalId, stepPath, step.id, step.title),
                      },
                      "編集",
                    ),
                    h(
                      "button",
                      {
                        class:
                          "text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600",
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
                    h("div", { class: "flex items-center flex-1" }, [
                    h(
                      "button",
                      {
                        class: `mr-2 px-2 py-1 text-xs rounded ${
                          todo.isFinished
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                        }`,
                        disabled: isGoalLocked,
                        onClick: () =>
                          !isGoalLocked &&
                          onToggleTodo(
                            goalId,
                            currentStepPath,
                            todo.id,
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
                    ]),
                    !isGoalLocked &&
                      h(
                        "div",
                        {
                          class:
                            "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        },
                        [
                          h(
                            "button",
                            {
                              class:
                                "text-xs px-1 py-0.5 bg-yellow-500 text-white rounded hover:bg-yellow-600",
                              onClick: () =>
                                onEditTodo(
                                  goalId,
                                  currentStepPath,
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
                              class:
                                "text-xs px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600",
                              onClick: () =>
                                onDeleteTodo(goalId, todo.id, currentStepPath),
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
                    isGoalLocked,
                    onEditStep: (
                      gId: string,
                      sPath: string[],
                      sId: string,
                      title: string,
                    ) => emit("edit-step", gId, sPath, sId, title),
                    onDeleteStep: (gId: string, sId: string, sPath: string[]) =>
                      emit("delete-step", gId, sPath, sId),
                    onAddSubStep: (gId: string, sPath: string[]) =>
                      emit("add-sub-step", gId, sPath),
                    onAddTodo: (gId: string, sPath: string[]) =>
                      emit("add-todo-to-step", gId, sPath),
                    onEditTodo: (
                      gId: string,
                      sPath: string[],
                      tId: string,
                      task: string,
                      finished: boolean,
                      weight?: number,
                    ) =>
                      emit(
                        "edit-todo-in-step",
                        gId,
                        sPath,
                        tId,
                        task,
                        finished,
                        weight,
                      ),
                    onDeleteTodo: (gId: string, tId: string, sPath: string[]) =>
                      emit("delete-todo-in-step", gId, sPath, tId),
                    onToggleTodo: (
                      gId: string,
                      sPath: string[],
                      tId: string,
                      currentStatus: boolean,
                    ) => {
                      emit(
                        "toggle-todo-in-step",
                        gId,
                        sPath,
                        tId,
                        currentStatus,
                      );
                    },
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
  <div class="goal-card rounded-lg bg-white p-6 shadow-md">
    <div class="goal-header mb-4 border-b pb-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            {{ props.goal.title }}
          </h2>
          <div class="mt-2">
            <span class="text-sm text-gray-600">達成率: </span>
            <span class="font-semibold">{{ props.goal.ratio }}%</span>
          </div>
          <div v-if="props.goal.betAmount" class="mt-2">
            <span class="text-sm text-gray-600">賭け金: </span>
            <span class="font-semibold text-green-600"
              >¥{{ props.goal.betAmount.toLocaleString() }}</span
            >
          </div>
          <div v-if="props.goal.isLocked" class="mt-2">
            <span
              class="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800"
            >
              ロック中（編集不可）
            </span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!props.goal.isLocked"
            class="rounded bg-purple-500 px-3 py-1 text-sm text-white hover:bg-purple-600"
            @click="handleBetClick"
          >
            賭ける
          </button>
          <button
            v-if="!props.goal.isLocked"
            class="rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600"
            @click="$emit('edit-goal', props.goal.id, props.goal.title)"
          >
            編集
          </button>
          <button
            v-if="!props.goal.isLocked"
            class="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
            :disabled="saving"
            @click="$emit('delete-goal', props.goal.id)"
          >
            削除
          </button>
        </div>
      </div>
    </div>

    <!-- Goal配下のtodoを表示 -->
    <div class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-700">TODO</h3>
        <button
          v-if="!goal.isLocked"
          class="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
          @click="$emit('add-todo', goal.id)"
        >
          + TODO追加
        </button>
      </div>
      <div v-if="goal.todos && goal.todos.length > 0" class="ml-4 space-y-1">
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
              :class="`mr-2 px-2 py-1 text-xs rounded ${
                todo.isFinished
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`"
              :disabled="saving || goal.isLocked"
              @click="$emit('toggle-todo', goal.id, todo.id, todo.isFinished)"
            >
              {{ todo.isFinished ? "✓ 完了" : "未完了" }}
            </button>
            <span class="mr-2 font-semibold text-blue-700">
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
          <div
            v-if="!goal.isLocked"
            class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <button
              class="rounded bg-yellow-500 px-1 py-0.5 text-xs text-white hover:bg-yellow-600"
              @click="
                $emit(
                  'edit-todo',
                  goal.id,
                  todo.id,
                  todo.task,
                  todo.isFinished,
                  todo.weight,
                )
              "
            >
              編集
            </button>
            <button
              class="rounded bg-red-500 px-1 py-0.5 text-xs text-white hover:bg-red-600"
              @click="$emit('delete-todo', goal.id, todo.id)"
            >
              削除
            </button>
          </div>
        </div>
      </div>
      <p v-else class="ml-4 italic text-gray-500">TODOがありません</p>
    </div>

    <div class="steps-container">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-700">ステップ</h3>
        <button
          v-if="!goal.isLocked"
          class="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
          @click="$emit('add-step', goal.id)"
        >
          + ステップ追加
        </button>
      </div>
      <div v-if="goal.steps && goal.steps.length > 0" class="space-y-2">
        <component
          :is="RoadmapStep"
          v-for="step in goal.steps"
          :key="step.id"
          :step="step"
          :level="0"
          :goal-id="goal.id"
          :step-path="[]"
          :is-goal-locked="goal.isLocked || false"
          :on-edit-step="
            (
              goalId: string,
              stepPath: string[],
              stepId: string,
              title: string,
            ) => $emit('edit-step', goalId, stepPath, stepId, title)
          "
          :on-delete-step="
            (goalId: string, stepId: string, stepPath: string[]) =>
              $emit('delete-step', goalId, stepPath, stepId)
          "
          :on-add-sub-step="
            (goalId: string, stepPath: string[]) =>
              $emit('add-sub-step', goalId, stepPath)
          "
          :on-add-todo="
            (goalId: string, stepPath: string[]) =>
              $emit('add-todo-to-step', goalId, stepPath)
          "
          :on-edit-todo="
            (
              goalId: string,
              stepPath: string[],
              todoId: string,
              task: string,
              isFinished: boolean,
              weight?: number,
            ) =>
              $emit(
                'edit-todo-in-step',
                goalId,
                stepPath,
                todoId,
                task,
                isFinished,
                weight,
              )
          "
          :on-delete-todo="
            (goalId: string, todoId: string, stepPath: string[]) =>
              $emit('delete-todo-in-step', goalId, stepPath, todoId)
          "
          :on-toggle-todo="
            (
              goalId: string,
              stepPath: string[],
              todoId: string,
              currentStatus: boolean,
            ) =>
              $emit(
                'toggle-todo-in-step',
                goalId,
                stepPath,
                todoId,
                currentStatus,
              )
          "
        />
      </div>
      <p v-else class="italic text-gray-500">ステップがありません</p>
    </div>

    <!-- 賭け金入力モーダル -->
    <div
      v-if="showBetModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="showBetModal = false"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6">
        <h2 class="mb-4 text-xl font-bold">目標達成に賭ける</h2>
        <p class="mb-4 text-sm text-gray-600">
          目標「{{ props.goal.title }}」の達成に賭ける金額を入力してください。
          <br />
          決済が完了すると、この目標は編集できなくなります。
        </p>
        <div class="mb-4">
          <label class="mb-2 block text-sm font-medium text-gray-700">
            賭け金（円）
          </label>
          <input
            v-model.number="betAmount"
            type="number"
            min="100"
            step="100"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="1000"
          />
          <p class="mt-1 text-xs text-gray-500">
            最小金額: ¥100
          </p>
        </div>
        <div class="flex justify-end gap-3">
          <button
            class="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            :disabled="isProcessingPayment"
            @click="showBetModal = false"
          >
            キャンセル
          </button>
          <button
            class="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
            :disabled="isProcessingPayment || !betAmount || betAmount < 100"
            @click="proceedToPayment"
          >
            {{ isProcessingPayment ? "処理中..." : "決済に進む" }}
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
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.step-item {
  position: relative;
}
</style>
