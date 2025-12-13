import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";

// admin.initializeApp()が呼ばれた後にfirestore()を取得する
const getDb = () => admin.firestore();

// 型定義
interface TodoDoc {
  task: string;
  isFinished: boolean;
  weight?: number;
}

interface StepWithChildren {
  id: string;
  title: string;
  steps: StepWithChildren[];
  todos?: TodoWithId[];
}

interface TodoWithId extends TodoDoc {
  id: string;
}

interface GoalWithSteps {
  id: string;
  title: string;
  ratio: number;
  steps: StepWithChildren[];
  todos?: TodoWithId[];
}

/**
 * 再帰的にステップをインポートする関数
 */
async function importStepsRecursively(
  userId: string,
  categoryId: string,
  goalId: string,
  steps: StepWithChildren[],
  parentPath: string[] = []
): Promise<void> {
  const db = getDb();

  for (const step of steps) {
    let docRef: admin.firestore.DocumentReference = db
      .collection("users")
      .doc(userId)
      .collection("category")
      .doc(categoryId)
      .collection("goals")
      .doc(goalId);

    // 親ステップのパスを追加
    for (const stepId of parentPath) {
      docRef = docRef.collection("steps").doc(stepId);
    }

    // ステップを作成
    const stepRef = docRef.collection("steps").doc(step.id);
    await stepRef.set({
      title: step.title,
    });

    // ステップ配下のtodoをインポート
    if (step.todos && step.todos.length > 0) {
      for (const todo of step.todos) {
        const todoRef = stepRef.collection("todo").doc(todo.id);
        await todoRef.set({
          task: todo.task,
          isFinished: todo.isFinished,
          ...(todo.weight !== undefined && { weight: todo.weight }),
        });
      }
    }

    // 子ステップを再帰的にインポート
    if (step.steps && step.steps.length > 0) {
      await importStepsRecursively(userId, categoryId, goalId, step.steps, [
        ...parentPath,
        step.id,
      ]);
    }
  }
}

/**
 * ゴール配下のtodoをインポートする関数
 */
async function importGoalTodos(
  userId: string,
  categoryId: string,
  goalId: string,
  todos: TodoWithId[]
): Promise<void> {
  const db = getDb();
  const goalRef = db
    .collection("users")
    .doc(userId)
    .collection("category")
    .doc(categoryId)
    .collection("goals")
    .doc(goalId);

  for (const todo of todos) {
    const todoRef = goalRef.collection("todo").doc(todo.id);
    await todoRef.set({
      task: todo.task,
      isFinished: todo.isFinished,
      ...(todo.weight !== undefined && { weight: todo.weight }),
    });
  }
}

/**
 * ゴールと全てのステップ階層をインポートする関数
 */
async function importGoalWithAllSteps(
  userId: string,
  categoryId: string,
  goalData: GoalWithSteps
): Promise<void> {
  const db = getDb();

  // ゴールを作成
  const goalRef = db
    .collection("users")
    .doc(userId)
    .collection("category")
    .doc(categoryId)
    .collection("goals")
    .doc(goalData.id);

  await goalRef.set({
    title: goalData.title,
    ratio: goalData.ratio,
  });

  // ゴール配下のtodoをインポート
  if (goalData.todos && goalData.todos.length > 0) {
    await importGoalTodos(userId, categoryId, goalData.id, goalData.todos);
  }

  // すべてのステップ階層を再帰的にインポート
  if (goalData.steps && goalData.steps.length > 0) {
    await importStepsRecursively(
      userId,
      categoryId,
      goalData.id,
      goalData.steps
    );
  }
}

/**
 * Cloud Function: userId, categoryId, JSONデータを受け取ってFirestoreにインポート
 */
export const importJson = onCall(
  {
    cors: ["http://localhost:3000", "http://127.0.0.1:3000"],
    region: "asia-northeast1",
  },
  async (request) => {
    const { userId, categoryId, goalData } = request.data;

    if (!userId || !categoryId || !goalData) {
      throw new Error("userId, categoryId, goalDataは必須です");
    }

    // goalDataの基本的な検証
    if (!goalData.id || !goalData.title || goalData.ratio === undefined) {
      throw new Error("goalDataには id, title, ratio が必要です");
    }

    try {
      await importGoalWithAllSteps(userId, categoryId, goalData);
      return {
        success: true,
        message: "データのインポートに成功しました",
        goalId: goalData.id,
      };
    } catch (error: any) {
      console.error("JSONインポートエラー:", error);
      throw new Error(`JSONインポートに失敗しました: ${error.message}`);
    }
  }
);
