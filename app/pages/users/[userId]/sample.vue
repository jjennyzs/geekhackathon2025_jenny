<script setup lang="ts">
import { ref, nextTick, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { VueFlow, useVueFlow, Handle, Position, type Node, type Edge } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import "@vue-flow/core/dist/style.css";
import { useFireStore } from "~/composables/useFireStore";

// ルートパラメータからuserIdを取得
const route = useRoute();
const userId = route.params.userId as string;
const goalId = "zkBU5Xi73AYPcfJcR8FY";

// Firestore composable
const { getGoalWithSteps } = useFireStore();

// ノード・エッジ
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const editingNodeId = ref<string | null>(null);
const editText = ref("");
const expandedNodes = ref<Set<string>>(new Set(["main"])); // 初期状態で展開されているノード
const loading = ref(true);
const error = ref<string | null>(null);
let nodeIdCounter = 100;

// Firestoreからデータを取得してノードとエッジを初期化
const initializeFlow = async () => {
    try {
        loading.value = true;
        error.value = null;

        // Firestoreからデータを取得
        const goalData = await getGoalWithSteps(userId, goalId);
        
        // デバッグ: 取得したデータを確認
        console.log("取得したデータ:", goalData);
        console.log("サブ目標の数:", goalData.steps?.length || 0);
        goalData.steps?.forEach((step, index) => {
            console.log(`サブ目標${index}:`, step.title, "孫目標の数:", step.steps?.length || 0);
            if (step.steps && step.steps.length > 0) {
                step.steps.forEach((grandchild, gIndex) => {
                    console.log(`  孫目標${gIndex}:`, grandchild.title);
                });
            }
        });

        // ノードとエッジをクリア
        nodes.value = [];
        edges.value = [];

        // 親目標（main）ノードを作成
        const mainNode: Node = {
            id: "main",
            type: "custom",
            position: { x: 50, y: 300 },
            data: { label: goalData.title || "大きな目標", isMain: true },
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
        };
        nodes.value.push(mainNode);

        // サブ目標ノードを作成
        let stepY = 100;
        goalData.steps.forEach((step, stepIndex) => {
            const stepNodeId = step.id || `step-${stepIndex}`;
            const stepNode: Node = {
                id: stepNodeId,
                type: "custom",
                position: { x: 400, y: stepY },
                data: { label: step.title || "サブ目標", parentId: "main" },
                style: {
                    background: "#dbeafe",
                    color: "#1e40af",
                    border: "2px solid #93c5fd",
                    borderRadius: "12px",
                    padding: "16px",
                    minWidth: "220px",
                },
            };
            nodes.value.push(stepNode);

            // 親目標からサブ目標へのエッジ
            edges.value.push({
                id: `e-main-${stepNodeId}`,
                source: "main",
                target: stepNodeId,
                sourceHandle: "source-right",
                targetHandle: "target-left",
                type: "smoothstep",
                animated: true,
            });

            // 孫目標ノードを作成
            let grandchildY = stepY - 50;
            if (step.steps && step.steps.length > 0) {
                // 孫目標を持つサブ目標を初期状態で展開する（リアクティビティを保つため新しいSetを作成）
                expandedNodes.value = new Set([...expandedNodes.value, stepNodeId]);
                
                step.steps.forEach((grandchildStep, grandchildIndex) => {
                    const grandchildNodeId = `${stepNodeId}-${grandchildStep.id || grandchildIndex}`;
                    const grandchildNode: Node = {
                        id: grandchildNodeId,
                        type: "custom",
                        position: { x: 700, y: grandchildY },
                        data: { label: grandchildStep.title || "孫目標", parentId: stepNodeId },
                        style: {
                            background: "#dcfce7",
                            color: "#166534",
                            border: "2px solid #86efac",
                            borderRadius: "12px",
                            padding: "12px",
                            minWidth: "180px",
                            fontSize: "14px",
                        },
                    };
                    nodes.value.push(grandchildNode);

                    // サブ目標から孫目標へのエッジ
                    edges.value.push({
                        id: `e-${stepNodeId}-${grandchildNodeId}`,
                        source: stepNodeId,
                        target: grandchildNodeId,
                        sourceHandle: "source-right",
                        targetHandle: "target-left",
                        type: "smoothstep",
                        animated: true,
                    });

                    grandchildY += 150;
                });
            }

            stepY += 150;
        });

        // ノードIDカウンターを更新（既存のIDと重複しないように）
        nodeIdCounter = Math.max(100, nodes.value.length * 10);
        
        // デバッグ: 作成されたノードを確認
        console.log("作成されたノード数:", nodes.value.length);
        console.log("展開されているノード:", Array.from(expandedNodes.value));
        nodes.value.forEach((node) => {
            const parentId = (node.data as any).parentId;
            console.log(`ノード ${node.id}:`, {
                label: (node.data as any).label,
                parentId: parentId,
                isVisible: !parentId || expandedNodes.value.has(parentId)
            });
        });
    } catch (err: any) {
        console.error("Error loading goal data:", err);
        error.value = err?.message || "データの読み込みに失敗しました";
    } finally {
        loading.value = false;
    }
};



// ノードの展開/折りたたみを切り替え
const toggleNodeExpansion = (nodeId: string) => {
    const newSet = new Set(expandedNodes.value);
    if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
    } else {
        newSet.add(nodeId);
    }
    expandedNodes.value = newSet;
};

// ノードに子ノードがあるかチェック
const hasChildren = (nodeId: string): boolean => {
    return nodes.value.some((n) => (n.data as any).parentId === nodeId);
};

// ノードが展開されているかチェック
const isExpanded = (nodeId: string): boolean => {
    return expandedNodes.value.has(nodeId);
};

// コンポーネントマウント時にデータを読み込む
onMounted(() => {
    initializeFlow();
});

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

    // 親ノードを展開（リアクティビティを保つため新しいSetを作成）
    expandedNodes.value = new Set([...expandedNodes.value, parentId]);
};

const deleteNode = (nodeId: string, isMain?: boolean) => {
    if (isMain) return; // メインノードは削除させない
    nodes.value = nodes.value.filter((n) => n.id !== nodeId);
    edges.value = edges.value.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
    );
};
// ノードが表示可能かどうかを再帰的にチェック
const isNodeVisible = (nodeId: string): boolean => {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (!node) return false;
    
    const parentId = (node.data as any).parentId;
    if (!parentId) return true; // 親を持たない（mainなど）は常に表示
    
    // 親ノードが展開されているかチェック
    if (!expandedNodes.value.has(parentId)) return false;
    
    // 親ノード自体が表示可能か再帰的にチェック
    return isNodeVisible(parentId);
};

const visibleNodes = computed<Node[]>(() => {
    return nodes.value.filter((node) => isNodeVisible(node.id));
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

            <div v-if="loading" class="flex items-center justify-center h-[calc(100vh-200px)]">
                <div class="text-lg text-gray-600">読み込み中...</div>
            </div>

            <div v-else-if="error" class="flex items-center justify-center h-[calc(100vh-200px)]">
                <div class="text-lg text-red-600">エラー: {{ error }}</div>
            </div>

            <ClientOnly v-else>
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
