import {
  doc,
  getDoc,
  collection,
  getDocs,
  type Firestore,
} from "firebase/firestore";
import type { Goal } from "../../@types/goal";

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

  return {
    getGoalWithSteps,
  };
};
