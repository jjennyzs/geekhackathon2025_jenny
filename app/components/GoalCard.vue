<script setup lang="ts">
import type { TodoDoc } from "../../@types/todoDoc";

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
};

// Props
const props = defineProps<{
  goal: GoalWithSteps;
  saving: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: "edit-goal", goalId: string, title: string): void;
  (e: "delete-goal", goalId: string): void;
  (e: "add-step", goalId: string): void;
  (e: "add-todo", goalId: string): void;
  (e: "edit-todo", goalId: string, todoId: string, task: string, isFinished: boolean, weight?: number): void;
  (e: "delete-todo", goalId: string, todoId: string): void;
  (e: "toggle-todo", goalId: string, todoId: string, currentStatus: boolean): void;
  (e: "edit-step", goalId: string, stepPath: string[], stepId: string, title: string): void;
  (e: "delete-step", goalId: string, stepPath: string[], stepId: string): void;
  (e: "add-sub-step", goalId: string, stepPath: string[]): void;
  (e: "add-todo-to-step", goalId: string, stepPath: string[]): void;
  (e: "edit-todo-in-step", goalId: string, stepPath: string[], todoId: string, task: string, isFinished: boolean, weight?: number): void;
  (e: "delete-todo-in-step", goalId: string, stepPath: string[], todoId: string): void;
  (e: "toggle-todo-in-step", goalId: string, stepPath: string[], todoId: string, currentStatus: boolean): void;
}>();

// RoadmapStepコンポーネント（簡略版、後で別ファイルに分けることも可能）
import { defineComponent, h, type PropType } from "vue";

const RoadmapStep = defineComponent({
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
    onToggleTodo: {
      type: Function as PropType<
        (goalId: string, stepPath: string[], todoId: string, currentStatus: boolean) => void
      >,
      required: true,
    },
  },
  setup(props) {
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
                          onClick: () => onToggleTodo(goalId, currentStepPath, todo.id, todo.isFinished),
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
                            onEditTodo(goalId, currentStepPath, todo.id, todo.task, todo.isFinished, todo.weight),
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
            step.steps.map((childStep: StepWithChildren) =>
              h(RoadmapStep, {
                key: childStep.id,
                step: childStep,
                level: level + 1,
                goalId,
                stepPath: currentStepPath,
                onEditStep: (gId: string, sPath: string[], sId: string, title: string) =>
                  emit("edit-step", gId, sPath, sId, title),
                onDeleteStep: (gId: string, sId: string, sPath: string[]) =>
                  emit("delete-step", gId, sPath, sId),
                onAddSubStep: (gId: string, sPath: string[]) =>
                  emit("add-sub-step", gId, sPath),
                onAddTodo: (gId: string, sPath: string[]) =>
                  emit("add-todo-to-step", gId, sPath),
                onEditTodo: (gId: string, sPath: string[], tId: string, task: string, finished: boolean, weight?: number) =>
                  emit("edit-todo-in-step", gId, sPath, tId, task, finished, weight),
                onDeleteTodo: (gId: string, tId: string, sPath: string[]) =>
                  emit("delete-todo-in-step", gId, sPath, tId),
                onToggleTodo: (gId: string, sPath: string[], tId: string, currentStatus: boolean) => {
                  emit("toggle-todo-in-step", gId, sPath, tId, currentStatus);
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
  <div class="goal-card bg-white rounded-lg shadow-md p-6">
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
            @click="$emit('edit-goal', goal.id, goal.title)"
            class="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            編集
          </button>
          <button
            @click="$emit('delete-goal', goal.id)"
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
          @click="$emit('add-todo', goal.id)"
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
              @click="$emit('toggle-todo', goal.id, todo.id, todo.isFinished)"
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
              @click="$emit('edit-todo', goal.id, todo.id, todo.task, todo.isFinished, todo.weight)"
              class="text-xs px-1 py-0.5 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              編集
            </button>
            <button
              @click="$emit('delete-todo', goal.id, todo.id)"
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
          @click="$emit('add-step', goal.id)"
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
          @edit-step="$emit('edit-step', $event[0], $event[1], $event[2], $event[3])"
          @delete-step="$emit('delete-step', $event[0], $event[1], $event[2])"
          @add-sub-step="$emit('add-sub-step', $event[0], $event[1])"
          @add-todo="$emit('add-todo-to-step', $event[0], $event[1])"
          @edit-todo="$emit('edit-todo-in-step', $event[0], $event[1], $event[2], $event[3], $event[4], $event[5])"
          @delete-todo="$emit('delete-todo-in-step', $event[0], $event[1], $event[2])"
          @toggle-todo-in-step="(goalId, stepPath, todoId, currentStatus) => $emit('toggle-todo-in-step', goalId, stepPath, todoId, currentStatus)"
        />
      </div>
      <p v-else class="text-gray-500 italic">ステップがありません</p>
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

