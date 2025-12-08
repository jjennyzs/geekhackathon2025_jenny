<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import { VueFlow, useVueFlow, Handle, Position, type Node, type Edge } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import "@vue-flow/core/dist/style.css";

// ノード・エッジ
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const editingNodeId = ref<string | null>(null);
const editText = ref("");
const expandedNodes = ref<Set<string>>(new Set(["main"])); // 初期状態で展開されているノード
let nodeIdCounter = 100;

// 初期ノードとエッジ
const initializeFlow = () => {
    nodes.value = [
        {
            id: "main",
            type: "custom",
            position: { x: 50, y: 300 },
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
            position: { x: 400, y: 100 },
            data: { label: "サブ目標1", parentId: "main" },
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
            data: { label: "サブ目標2", parentId: "main" },
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
            position: { x: 400, y: 400 },
            data: { label: "サブ目標3", parentId: "main" },
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
            position: { x: 400, y: 550 },
            data: { label: "サブ目標4", parentId: "main" },
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
            position: { x: 400, y: 700 },
            data: { label: "サブ目標5", parentId: "main" },
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
            position: { x: 700, y: 300 },
            data: { label: "孫目標1", parentId: "3" },
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
            position: { x: 700, y: 450 },
            data: { label: "孫目標2", parentId: "3" },
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
            position: { x: 700, y: 600 },
            data: { label: "孫目標3", parentId: "3" },
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
            position: { x: 700, y: 750 },
            data: { label: "孫目標4", parentId: "3" },
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
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
        {
            id: "e-main-2",
            source: "main",
            target: "2",
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
        {
            id: "e-main-3",
            source: "main",
            target: "3",
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
        {
            id: "e-main-4",
            source: "main",
            target: "4",
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
        {
            id: "e-main-5",
            source: "main",
            target: "5",
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
        {
            id: "e-3-3-1",
            source: "3",
            target: "3-1",
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
        {
            id: "e-3-3-2",
            source: "3",
            target: "3-2",
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
        {
            id: "e-3-3-3",
            source: "3",
            target: "3-3",
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
        {
            id: "e-3-3-4",
            source: "3",
            target: "3-4",
            sourceHandle: "source-right",
            targetHandle: "target-left",
            type: "smoothstep",
            animated: true,
        },
    ];
};



// ノードの展開/折りたたみを切り替え
const toggleNodeExpansion = (nodeId: string) => {
    if (expandedNodes.value.has(nodeId)) {
        expandedNodes.value.delete(nodeId);
    } else {
        expandedNodes.value.add(nodeId);
    }
};

// ノードに子ノードがあるかチェック
const hasChildren = (nodeId: string): boolean => {
    return nodes.value.some((n) => (n.data as any).parentId === nodeId);
};

// ノードが展開されているかチェック
const isExpanded = (nodeId: string): boolean => {
    return expandedNodes.value.has(nodeId);
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
    // 親ノードの右側に縦並びで配置
    const newX = parentNode.position.x + 300;
    const newY = parentNode.position.y + siblingsCount * 150;

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
        sourceHandle: "source-right",
        targetHandle: "target-left",
        type: "smoothstep",
        animated: true,
    });

    // 親ノードを展開
    expandedNodes.value.add(parentId);
};

const deleteNode = (nodeId: string, isMain?: boolean) => {
    if (isMain) return; // メインノードは削除させない
    nodes.value = nodes.value.filter((n) => n.id !== nodeId);
    edges.value = edges.value.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
    );
};
const visibleNodes = computed<Node[]>(() => {
    return nodes.value.filter((node) => {
        const parentId = (node.data as any).parentId;
        if (!parentId) return true; // 親を持たない（mainなど）は常に表示
        return expandedNodes.value.has(parentId);
    });
});

const visibleEdges = computed<Edge[]>(() => {
    return edges.value.filter((edge) => {
        const targetNode = nodes.value.find((n) => n.id === edge.target);
        if (!targetNode) return false;

        const parentId = (targetNode.data as any).parentId;
        if (!parentId) return true; // 親を持たないノードへのエッジは常に表示

        return expandedNodes.value.has(parentId);
    });
});
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
                <div class="h-[calc(100vh-200px)] w-full overflow-hidden rounded-lg border border-gray-300">
                    <VueFlow :nodes="visibleNodes" :edges="visibleEdges" :fit-view-on-init="true"
                        class="vue-flow-container">
                        <Background pattern-color="#e5e7eb" :gap="20" />

                        <!-- ★ ここがカスタムノード本体（slot 版） ★ -->
                        <template #node-custom="nodeProps">
                            <div class="custom-node" :style="(nodeProps as any).style" @dblclick="startEdit(nodeProps.id)"
                                @click="
                  if (!editingNodeId) {
                                    if (hasChildren(nodeProps.id)) {
                                        toggleNodeExpansion(nodeProps.id);
                                    }
                                }
                                    ">
                                <!-- 左側のHandle（入力用） -->
                                <Handle
                                    id="target-left"
                                    type="target"
                                    :position="Position.Left"
                                    class="node-handle node-handle-left"
                                />
                                
                                <div v-if="editingNodeId === nodeProps.id" class="node-edit-mode">
                                    <input :id="'input-' + nodeProps.id" v-model="editText" class="node-input"
                                        @blur="saveEdit" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
                                </div>
                                <div v-else class="node-content">
                                    <div class="node-header">
                                        <div class="node-label" :style="{
                                            color: (nodeProps.data as any).isMain
                                                ? 'white'
                                                : 'inherit',
                                        }">
                                            {{ (nodeProps.data as any).label || "無題" }}
                                        </div>
                                        <!-- 展開/折りたたみボタン -->
                                        <button v-if="hasChildren(nodeProps.id)" class="expand-toggle-btn"
                                            :class="{ expanded: isExpanded(nodeProps.id) }"
                                            @click.stop="toggleNodeExpansion(nodeProps.id)" :title="isExpanded(nodeProps.id) ? '折りたたむ' : '展開する'
                                                ">
                                            {{ isExpanded(nodeProps.id) ? "▼" : "▶" }}
                                        </button>
                                    </div>
                                    <div class="node-actions">
                                        <button class="node-btn" title="編集" @click.stop="startEdit(nodeProps.id)">
                                            ✏️
                                        </button>
                                        <button class="node-btn" title="子ノードを追加"
                                            @click.stop="addChildNode(nodeProps.id)">
                                            +
                                        </button>
                                        <button v-if="!(nodeProps.data as any).isMain" class="node-btn node-btn-delete"
                                            title="削除" @click.stop="
                                                deleteNode(nodeProps.id, (nodeProps.data as any).isMain)
                                                ">
                                            ×
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- 右側のHandle（出力用） -->
                                <Handle
                                    id="source-right"
                                    type="source"
                                    :position="Position.Right"
                                    class="node-handle node-handle-right"
                                />
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

.node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
}

.node-label {
    font-weight: 600;
    word-wrap: break-word;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    display: block;
    flex: 1;
    color: inherit;
}

.expand-toggle-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid currentColor;
    background: rgba(255, 255, 255, 0.3);
    color: inherit;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
    padding: 0;
}

.expand-toggle-btn:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
}

.expand-toggle-btn.expanded {
    background: rgba(255, 255, 255, 0.6);
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

.node-handle {
    width: 10px;
    height: 10px;
    background: #3b82f6;
    border: 2px solid white;
    border-radius: 50%;
}

.node-handle-left {
    left: -5px;
}

.node-handle-right {
    right: -5px;
}
</style>
