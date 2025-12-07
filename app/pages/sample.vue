<script setup lang="ts">
import { ref, nextTick } from "vue";
import { VueFlow, useVueFlow, type Node, type Edge } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import "@vue-flow/core/dist/style.css";

// ノード・エッジ
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const editingNodeId = ref<string | null>(null);
const editText = ref("");
let nodeIdCounter = 100;

// 初期ノードとエッジ
const initializeFlow = () => {
  nodes.value = [
    {
      id: "main",
      type: "custom",
      position: { x: 400, y: 50 },
      data: { label: "大きな目標", isMain: true },
      style: {
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        color: "white",
        border: "2px solid #1e40af",
        borderRadius: "12px",
        padding: "20px",
        minWidth: "280px",
        fontSize: "18px",
        fontWeight: "bold",
      },
    },
    {
      id: "1",
      type: "custom",
      position: { x: 100, y: 250 },
      data: { label: "サブ目標1" },
      style: {
        background: "#dbeafe",
        color: "#1e40af",
        border: "2px solid #93c5fd",
        borderRadius: "12px",
        padding: "16px",
        minWidth: "220px",
      },
    },
    {
      id: "2",
      type: "custom",
      position: { x: 400, y: 250 },
      data: { label: "サブ目標2" },
      style: {
        background: "#dbeafe",
        color: "#1e40af",
        border: "2px solid #93c5fd",
        borderRadius: "12px",
        padding: "16px",
        minWidth: "220px",
      },
    },
    {
      id: "3",
      type: "custom",
      position: { x: 700, y: 250 },
      data: { label: "サブ目標3" },
      style: {
        background: "#dbeafe",
        color: "#1e40af",
        border: "2px solid #93c5fd",
        borderRadius: "12px",
        padding: "16px",
        minWidth: "220px",
      },
    },
    {
      id: "4",
      type: "custom",
      position: { x: 1000, y: 250 },
      data: { label: "サブ目標4" },
      style: {
        background: "#dbeafe",
        color: "#1e40af",
        border: "2px solid #93c5fd",
        borderRadius: "12px",
        padding: "16px",
        minWidth: "220px",
      },
    },
    {
      id: "5",
      type: "custom",
      position: { x: 1300, y: 250 },
      data: { label: "サブ目標5" },
      style: {
        background: "#dbeafe",
        color: "#1e40af",
        border: "2px solid #93c5fd",
        borderRadius: "12px",
        padding: "16px",
        minWidth: "220px",
      },
    },
    {
      id: "3-1",
      type: "custom",
      position: { x: 600, y: 450 },
      data: { label: "孫目標1" },
      style: {
        background: "#dcfce7",
        color: "#166534",
        border: "2px solid #86efac",
        borderRadius: "12px",
        padding: "12px",
        minWidth: "180px",
        fontSize: "14px",
      },
    },
    {
      id: "3-2",
      type: "custom",
      position: { x: 800, y: 450 },
      data: { label: "孫目標2" },
      style: {
        background: "#dcfce7",
        color: "#166534",
        border: "2px solid #86efac",
        borderRadius: "12px",
        padding: "12px",
        minWidth: "180px",
        fontSize: "14px",
      },
    },
    {
      id: "3-3",
      type: "custom",
      position: { x: 1000, y: 450 },
      data: { label: "孫目標3" },
      style: {
        background: "#dcfce7",
        color: "#166534",
        border: "2px solid #86efac",
        borderRadius: "12px",
        padding: "12px",
        minWidth: "180px",
        fontSize: "14px",
      },
    },
    {
      id: "3-4",
      type: "custom",
      position: { x: 1200, y: 450 },
      data: { label: "孫目標4" },
      style: {
        background: "#dcfce7",
        color: "#166534",
        border: "2px solid #86efac",
        borderRadius: "12px",
        padding: "12px",
        minWidth: "180px",
        fontSize: "14px",
      },
    },
  ];

  edges.value = [
    {
      id: "e-main-1",
      source: "main",
      target: "1",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-main-2",
      source: "main",
      target: "2",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-main-3",
      source: "main",
      target: "3",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-main-4",
      source: "main",
      target: "4",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-main-5",
      source: "main",
      target: "5",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-3-3-1",
      source: "3",
      target: "3-1",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-3-3-2",
      source: "3",
      target: "3-2",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-3-3-3",
      source: "3",
      target: "3-3",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-3-3-4",
      source: "3",
      target: "3-4",
      type: "smoothstep",
      animated: true,
    },
  ];
};

initializeFlow();

// ===== ラベル編集系の処理（グローバル） =====
const startEdit = (nodeId: string) => {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node) return;

  editingNodeId.value = nodeId;
  editText.value = (node.data as any).label ?? "";

  nextTick(() => {
    const input = document.getElementById(
      `input-${nodeId}`,
    ) as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const saveEdit = () => {
  if (!editingNodeId.value) return;
  const value = editText.value.trim();
  const node = nodes.value.find((n) => n.id === editingNodeId.value);
  if (node && value) {
    node.data = { ...(node.data as any), label: value };
  }
  editingNodeId.value = null;
};

const cancelEdit = () => {
  editingNodeId.value = null;
};

const addChildNode = (parentId: string) => {
  const parentNode = nodes.value.find((n) => n.id === parentId);
  if (!parentNode) return;

  const siblingsCount = nodes.value.filter(
    (n) => (n.data as any).parentId === parentId,
  ).length;

  const newId = `node-${nodeIdCounter++}`;
  const newX = parentNode.position.x + 260;
  const newY = parentNode.position.y - 80 + siblingsCount * 80;

  nodes.value.push({
    id: newId,
    type: "custom",
    position: { x: newX, y: newY },
    data: {
      parentId,
      label: "新しい目標",
    },
    style: {
      background: "#fef3c7",
      color: "#92400e",
      border: "2px solid #fcd34d",
      borderRadius: "12px",
      padding: "12px",
      minWidth: "180px",
      fontSize: "14px",
    },
  });

  edges.value.push({
    id: `e-${parentId}-${newId}`,
    source: parentId,
    target: newId,
    type: "smoothstep",
    animated: true,
  });
};

const deleteNode = (nodeId: string, isMain?: boolean) => {
  if (isMain) return; // メインノードは削除させない
  nodes.value = nodes.value.filter((n) => n.id !== nodeId);
  edges.value = edges.value.filter(
    (e) => e.source !== nodeId && e.target !== nodeId,
  );
};

// （一応セットしておくだけ）
useVueFlow();
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <div class="p-8">
      <h1 class="mb-8 text-center text-3xl font-bold text-gray-800">
        目標へのロードマップ
      </h1>

      <ClientOnly>
        <div
          class="h-[calc(100vh-200px)] w-full overflow-hidden rounded-lg border border-gray-300"
        >
          <VueFlow
            :nodes="nodes"
            :edges="edges"
            :fit-view-on-init="true"
            class="vue-flow-container"
          >
            <Background pattern-color="#e5e7eb" :gap="20" />

            <!-- ★ ここがカスタムノード本体（slot 版） ★ -->
            <template #node-custom="nodeProps">
              <div
                class="custom-node"
                :style="nodeProps.style"
                @dblclick="startEdit(nodeProps.id)"
              >
                <div
                  v-if="editingNodeId === nodeProps.id"
                  class="node-edit-mode"
                >
                  <input
                    :id="'input-' + nodeProps.id"
                    v-model="editText"
                    class="node-input"
                    @blur="saveEdit"
                    @keyup.enter="saveEdit"
                    @keyup.esc="cancelEdit"
                  />
                </div>
                <div v-else class="node-content">
                  <div
                    class="node-label"
                    :style="{
                      color: (nodeProps.data as any).isMain
                        ? 'white'
                        : 'inherit',
                    }"
                  >
                    {{ (nodeProps.data as any).label || "無題" }}
                  </div>
                  <div class="node-actions">
                    <button
                      class="node-btn"
                      title="編集"
                      @click.stop="startEdit(nodeProps.id)"
                    >
                      ✏️
                    </button>
                    <button
                      class="node-btn"
                      title="子ノードを追加"
                      @click.stop="addChildNode(nodeProps.id)"
                    >
                      +
                    </button>
                    <button
                      v-if="!(nodeProps.data as any).isMain"
                      class="node-btn node-btn-delete"
                      title="削除"
                      @click.stop="
                        deleteNode(nodeProps.id, (nodeProps.data as any).isMain)
                      "
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </VueFlow>
        </div>
      </ClientOnly>
    </div>
  </main>
</template>

<style scoped>
.vue-flow-container {
  background: #f9fafb;
}

.custom-node {
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.custom-node:hover {
  transform: scale(1.02);
}

.node-selected {
  box-shadow: 0 0 0 2px #3b82f6;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.node-label {
  font-weight: 600;
  word-wrap: break-word;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  display: block;
  width: 100%;
  color: inherit;
}

.node-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.custom-node:hover .node-actions {
  opacity: 1;
}

.node-btn {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.node-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.node-btn-delete {
  color: #dc2626;
}

.node-edit-mode {
  width: 100%;
}

.node-input {
  width: 100%;
  padding: 8px;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  font-size: inherit;
  font-weight: inherit;
  background: white;
  color: inherit;
  outline: none;
}
</style>
