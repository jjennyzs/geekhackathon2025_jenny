<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import 'vue-good-table/dist/vue-good-table.css';

// 復習間隔の計算式タイプ
type ReviewFormulaType = 'ebbinghaus' | 'custom' | 'linear';

// 復習間隔の設定
const reviewIntervals = ref<number[]>([1, 3, 7, 14, 30]); // デフォルト: エビングハウスの忘却曲線
const formulaType = ref<ReviewFormulaType>('ebbinghaus');
const customIntervals = ref<string>('1,3,7,14,30');
const linearInterval = ref<number>(7); // 線形の場合の間隔（日）

// 列数
const reviewColumnCount = ref(5);

// テーブルの行データ
interface ReviewRow {
  id: string;
  content: string;
  firstLearnedDate: Date | null;
  [key: string]: any; // 動的な復習日付列
}

const rows = ref<ReviewRow[]>([
  {
    id: '1',
    content: '',
    firstLearnedDate: null,
  },
]);

// 復習間隔を更新
const updateReviewIntervals = () => {
  if (formulaType.value === 'custom') {
    try {
      reviewIntervals.value = customIntervals.value
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);
      if (reviewIntervals.value.length === 0) {
        reviewIntervals.value = [1, 3, 7, 14, 30];
      }
    } catch (error) {
      console.error('Invalid custom intervals:', error);
      reviewIntervals.value = [1, 3, 7, 14, 30];
    }
  } else if (formulaType.value === 'linear') {
    reviewIntervals.value = Array.from({ length: reviewColumnCount.value }, (_, i) => linearInterval.value * (i + 1));
  } else if (formulaType.value === 'ebbinghaus') {
    // エビングハウスの忘却曲線ベース
    reviewIntervals.value = [1, 3, 7, 14, 30, 60, 90];
  }
  
  // 列数に合わせて調整
  if (reviewIntervals.value.length < reviewColumnCount.value) {
    const lastInterval = reviewIntervals.value[reviewIntervals.value.length - 1] || 30;
    while (reviewIntervals.value.length < reviewColumnCount.value) {
      reviewIntervals.value.push(lastInterval * 2);
    }
  } else {
    reviewIntervals.value = reviewIntervals.value.slice(0, reviewColumnCount.value);
  }
  
  updateTableColumns();
  updateReviewDates();
};

// 復習日付を計算
const calculateReviewDate = (firstDate: Date | null, intervalDays: number): Date | null => {
  if (!firstDate) return null;
  const reviewDate = new Date(firstDate);
  reviewDate.setDate(reviewDate.getDate() + intervalDays);
  return reviewDate;
};

// 復習日付を更新
const updateReviewDates = () => {
  rows.value.forEach((row) => {
    if (row.firstLearnedDate) {
      reviewIntervals.value.forEach((interval, index) => {
        const reviewDate = calculateReviewDate(row.firstLearnedDate, interval);
        row[`review_${index + 1}`] = reviewDate;
      });
    } else {
      reviewIntervals.value.forEach((_, index) => {
        row[`review_${index + 1}`] = null;
      });
    }
  });
};

// テーブルの列定義
const columns = computed(() => {
  const cols: any[] = [
    {
      label: '内容',
      field: 'content',
      editable: true,
      sortable: false,
    },
    {
      label: '初回学習日',
      field: 'firstLearnedDate',
      type: 'date',
      dateInputFormat: 'yyyy-MM-dd',
      dateOutputFormat: 'yyyy-MM-dd',
      editable: true,
      sortable: false,
    },
  ];

  // 復習列を追加
  for (let i = 0; i < reviewColumnCount.value; i++) {
    cols.push({
      label: `復習${i + 1}`,
      field: `review_${i + 1}`,
      type: 'date',
      dateInputFormat: 'yyyy-MM-dd',
      dateOutputFormat: 'yyyy-MM-dd',
      editable: false,
      sortable: false,
      formatFn: (value: Date | null) => {
        if (!value) return '';
        return value.toLocaleDateString('ja-JP');
      },
    });
  }

  return cols;
});

// テーブルの列を更新
const updateTableColumns = () => {
  // columnsはcomputedなので自動更新される
  // 行データの構造を更新
  rows.value.forEach((row) => {
    // 不要な列を削除
    Object.keys(row).forEach((key) => {
      if (key.startsWith('review_')) {
        const index = parseInt(key.replace('review_', ''), 10);
        if (index > reviewColumnCount.value) {
          delete row[key];
        }
      }
    });
  });
};

// 初回学習日の変更を監視
watch(
  () => rows.value.map((r) => r.firstLearnedDate),
  () => {
    updateReviewDates();
  },
  { deep: true }
);

// 列数を増やす
const addColumn = () => {
  reviewColumnCount.value++;
  updateReviewIntervals();
};

// 列数を減らす
const removeColumn = () => {
  if (reviewColumnCount.value > 1) {
    reviewColumnCount.value--;
    updateReviewIntervals();
  }
};

// 行を追加
const addRow = () => {
  const newRow: ReviewRow = {
    id: Date.now().toString(),
    content: '',
    firstLearnedDate: null,
  };
  rows.value.push(newRow);
};

// 行を削除
const removeRow = (rowId: string) => {
  const index = rows.value.findIndex((r) => r.id === rowId);
  if (index > -1) {
    rows.value.splice(index, 1);
  }
};

// カスタム間隔の適用
const applyCustomIntervals = () => {
  updateReviewIntervals();
};

// 初期化
updateReviewIntervals();
</script>

<template>
  <div class="container mx-auto max-w-6xl px-4 py-8">
    <h2 class="mb-6 text-2xl font-bold">復習スケジュール表</h2>

    <!-- 設定パネル -->
    <div class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 class="mb-4 text-lg font-semibold">復習間隔の設定</h3>

      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          計算式タイプ
        </label>
        <select
          v-model="formulaType"
          @change="updateReviewIntervals"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ebbinghaus">エビングハウスの忘却曲線</option>
          <option value="linear">線形（等間隔）</option>
          <option value="custom">カスタム</option>
        </select>
      </div>

      <!-- 線形設定 -->
      <div v-if="formulaType === 'linear'" class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          間隔（日）
        </label>
        <input
          v-model.number="linearInterval"
          type="number"
          min="1"
          @change="updateReviewIntervals"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- カスタム設定 -->
      <div v-if="formulaType === 'custom'" class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          間隔（日）をカンマ区切りで入力（例: 1,3,7,14,30）
        </label>
        <div class="flex gap-2">
          <input
            v-model="customIntervals"
            type="text"
            placeholder="1,3,7,14,30"
            class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            @click="applyCustomIntervals"
            class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            適用
          </button>
        </div>
      </div>

      <!-- 列数設定 -->
      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          復習列の数: {{ reviewColumnCount }}
        </label>
        <div class="flex gap-2">
          <button
            @click="removeColumn"
            :disabled="reviewColumnCount <= 1"
            class="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            - 列を減らす
          </button>
          <button
            @click="addColumn"
            class="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            + 列を増やす
          </button>
        </div>
      </div>

      <!-- 現在の間隔表示 -->
      <div class="rounded-md bg-gray-50 p-3">
        <p class="text-sm font-medium text-gray-700">現在の復習間隔:</p>
        <p class="text-sm text-gray-600">
          {{ reviewIntervals.join(', ') }} 日後
        </p>
      </div>
    </div>

    <!-- テーブル操作ボタン -->
    <div class="mb-4 flex justify-end">
      <button
        @click="addRow"
        class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        + 行を追加
      </button>
    </div>

    <!-- テーブル -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <vue-good-table
        :columns="columns"
        :rows="rows"
        :search-options="{
          enabled: false,
        }"
        :pagination-options="{
          enabled: true,
          perPage: 10,
        }"
        style-class="vgt-table striped"
        @on-cell-edit="updateReviewDates"
      >
        <template #table-row="props">
          <span v-if="props.column.field === 'firstLearnedDate'">
            <input
              v-if="props.row.firstLearnedDate"
              v-model="props.row.firstLearnedDate"
              type="date"
              @change="updateReviewDates"
              class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
            />
            <input
              v-else
              type="date"
              @change="
                (e: Event) => {
                  const target = e.target as HTMLInputElement;
                  if (target) {
                    props.row.firstLearnedDate = target.value
                      ? new Date(target.value)
                      : null;
                    updateReviewDates();
                  }
                }
              "
              class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
            />
          </span>
          <span v-else-if="props.column.field === 'content'">
            <input
              v-model="props.row.content"
              type="text"
              placeholder="学習内容を入力"
              class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
            />
          </span>
          <span v-else-if="props.column.field.startsWith('review_')">
            {{
              props.row[props.column.field]
                ? new Date(props.row[props.column.field]).toLocaleDateString(
                    'ja-JP'
                  )
                : '-'
            }}
          </span>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </div>
  </div>
</template>

