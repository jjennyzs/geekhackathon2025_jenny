import {
  doc,
  getDoc,
  collection,
  getDocs,
  type Firestore,
} from "firebase/firestore";
import type { Goal } from "../../@types/goal";
import type { StepDoc } from "../../@types/stepDoc";
import type { TodoDoc } from "../../@types/todoDoc";

export const useFireStore = () => {
  const { $db } = useNuxtApp();
  const db = $db as Firestore;

  /**
   * 目標とそのサブ目標、孫目標を取得する関数
   * @param uid - ユーザーID
   * @param goalId - 目標ID
   * @returns 親目標、サブ目標、孫目標を含むオブジェクト
   */
  const getGoalWithSteps = async (uid: string, goalId: string) => {
    try {
      // 親目標を取得
      const goalRef = doc(db, "users", uid, "goals", goalId);
      const goalSnap = await getDoc(goalRef);

      if (!goalSnap.exists()) {
        throw new Error(`Goal with id ${goalId} not found`);
      }

      const parentGoal = goalSnap.data() as Goal;

      // サブ目標（steps）を取得
      const stepsRef = collection(db, "users", uid, "goals", goalId, "steps");
      const stepsSnap = await getDocs(stepsRef);

      const steps = await Promise.all(
        stepsSnap.docs.map(async (stepDoc) => {
          const stepData = stepDoc.data() as Goal;
          const stepId = stepDoc.id;

          // 孫目標（steps/subStep）を取得
          const grandchildStepsRef = collection(
            db,
            "users",
            uid,
            "goals",
            goalId,
            "steps",
            stepId,
            "subStep",
          );
          const grandchildStepsSnap = await getDocs(grandchildStepsRef);

          const grandchildSteps = grandchildStepsSnap.docs.map(
            (grandchildDoc) => ({
              id: grandchildDoc.id,
              ...(grandchildDoc.data() as Goal),
            }),
          );

          return {
            id: stepId,
            ...stepData,
            steps: grandchildSteps,
          };
        }),
      );

      return {
        id: goalId,
        ...parentGoal,
        steps,
      };
    } catch (error) {
      console.error("Error fetching goal with steps:", error);
      throw error;
    }
  };

  type TodoWithId = TodoDoc & {
    id: string;
  };

  type StepWithChildren = {
    id: string;
    title: string;
    steps: StepWithChildren[];
    todos?: TodoWithId[];
  };

  /**
   * todoコレクションを取得する関数
   * @param uid - ユーザーID
   * @param categoryId - カテゴリID
   * @param goalId - 目標ID
   * @param stepPath - ステップのパス（空の場合はgoalId配下のtodoを取得）
   * @returns todoの配列
   */
  const getTodos = async (
    uid: string,
    categoryId: string,
    goalId: string,
    stepPath: string[] = [],
  ): Promise<TodoWithId[]> => {
    try {
      let todosRef;
      if (stepPath.length === 0) {
        // goalId配下のtodoを取得
        todosRef = collection(
          db,
          "users",
          uid,
          "category",
          categoryId,
          "goals",
          goalId,
          "todo",
        );
      } else {
        // stepId配下のtodoを取得
        const allSegments: any[] = [
          "users",
          uid,
          "category",
          categoryId,
          "goals",
          goalId,
        ];
        for (const stepId of stepPath) {
          allSegments.push("steps", stepId);
        }
        allSegments.push("todo");
        todosRef = collection(db, ...(allSegments as [string, ...string[]]));
      }

      const todosSnap = await getDocs(todosRef);
      const todos: TodoWithId[] = todosSnap.docs.map((todoDoc) => ({
        id: todoDoc.id,
        ...(todoDoc.data() as TodoDoc),
      }));

      return todos;
    } catch (error) {
      // todoコレクションが存在しない場合は空配列を返す
      return [];
    }
  };

  /**
   * 再帰的にステップを取得する関数
   * @param uid - ユーザーID
   * @param categoryId - カテゴリID
   * @param goalId - 目標ID
   * @param parentPath - 親ステップのパス（再帰的に使用）
   * @returns ステップの階層構造
   */
  const getStepsRecursively = async (
    uid: string,
    categoryId: string,
    goalId: string,
    parentPath: string[] = [],
  ): Promise<StepWithChildren[]> => {
    try {
      // ステップのパスを構築
      const pathSegments: string[] = [
        "users",
        uid,
        "category",
        categoryId,
        "goals",
        goalId,
      ];

      // 親ステップのパスを追加
      for (const stepId of parentPath) {
        pathSegments.push("steps", stepId);
      }

      // 最後に"steps"を追加
      pathSegments.push("steps");

      // 現在のレベルのステップを取得
      // Firestoreのcollectionは可変長引数を受け取るため、パスを動的に構築
      let stepsRef;
      if (parentPath.length === 0) {
        // 直接的なパス
        stepsRef = collection(
          db,
          "users",
          uid,
          "category",
          categoryId,
          "goals",
          goalId,
          "steps",
        );
      } else {
        // 再帰的なパス - 型アサーションを使用
        const allSegments: any[] = [
          "users",
          uid,
          "category",
          categoryId,
          "goals",
          goalId,
        ];
        for (const stepId of parentPath) {
          allSegments.push("steps", stepId);
        }
        allSegments.push("steps");
        stepsRef = collection(db, ...(allSegments as [string, ...string[]]));
      }
      const stepsSnap = await getDocs(stepsRef);

      // 各ステップに対して再帰的に子ステップを取得
      const steps: StepWithChildren[] = await Promise.all(
        stepsSnap.docs.map(async (stepDoc) => {
          const stepData = stepDoc.data() as StepDoc;
          const stepId = stepDoc.id;

          // 子ステップを再帰的に取得
          const childSteps: StepWithChildren[] = await getStepsRecursively(
            uid,
            categoryId,
            goalId,
            [...parentPath, stepId],
          );

          // ステップ配下のtodoを取得
          const todos: TodoWithId[] = await getTodos(
            uid,
            categoryId,
            goalId,
            [...parentPath, stepId],
          );

          return {
            id: stepId,
            title: stepData.title,
            steps: childSteps,
            todos: todos.length > 0 ? todos : undefined,
          };
        }),
      );

      return steps;
    } catch (error) {
      console.error("Error fetching steps recursively:", error);
      // ステップが存在しない場合は空配列を返す
      return [];
    }
  };

  type GoalWithSteps = {
    id: string;
    title: string;
    ratio: number;
    steps: StepWithChildren[];
    todos?: TodoWithId[];
  };

  /**
   * 目標とそのすべてのステップ階層を取得する関数
   * @param uid - ユーザーID
   * @param categoryId - カテゴリID
   * @param goalId - 目標ID
   * @returns 目標とステップ階層
   */
  const getGoalWithAllSteps = async (
    uid: string,
    categoryId: string,
    goalId: string,
  ): Promise<GoalWithSteps> => {
    try {
      // 目標を取得
      const goalRef = doc(
        db,
        "users",
        uid,
        "category",
        categoryId,
        "goals",
        goalId,
      );
      const goalSnap = await getDoc(goalRef);

      if (!goalSnap.exists()) {
        throw new Error(
          `Goal with id ${goalId} not found in category ${categoryId}`,
        );
      }

      const goalData = goalSnap.data() as Goal;

      // すべてのステップ階層を再帰的に取得
      const steps: StepWithChildren[] = await getStepsRecursively(
        uid,
        categoryId,
        goalId,
      );

      // goalId配下のtodoを取得
      const todos: TodoWithId[] = await getTodos(uid, categoryId, goalId, []);

      return {
        id: goalId,
        ...goalData,
        steps,
        todos: todos.length > 0 ? todos : undefined,
      };
    } catch (error) {
      console.error("Error fetching goal with all steps:", error);
      throw error;
    }
  };

  /**
   * カテゴリ内のすべての目標とそのステップ階層を取得する関数
   * @param uid - ユーザーID
   * @param categoryId - カテゴリID
   * @returns 目標とステップ階層の配列
   */
  const getAllGoalsWithSteps = async (
    uid: string,
    categoryId: string,
  ): Promise<GoalWithSteps[]> => {
    try {
      // カテゴリ内のすべての目標を取得
      const goalsRef = collection(
        db,
        "users",
        uid,
        "category",
        categoryId,
        "goals",
      );
      const goalsSnap = await getDocs(goalsRef);

      // 各目標に対してステップ階層を取得
      const goals: GoalWithSteps[] = await Promise.all(
        goalsSnap.docs.map(async (goalDoc) => {
          const goalData = goalDoc.data() as Goal;
          const goalId = goalDoc.id;

          // すべてのステップ階層を再帰的に取得
          const steps: StepWithChildren[] = await getStepsRecursively(
            uid,
            categoryId,
            goalId,
          );

          return {
            id: goalId,
            ...goalData,
            steps,
          };
        }),
      );

      return goals;
    } catch (error) {
      console.error("Error fetching all goals with steps:", error);
      throw error;
    }
  };

  return {
    getGoalWithSteps,
    getStepsRecursively,
    getGoalWithAllSteps,
    getAllGoalsWithSteps,
  };
};
