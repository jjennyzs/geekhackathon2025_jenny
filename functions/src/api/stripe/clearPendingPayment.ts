import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

const getDb = () => admin.firestore();

interface ClearPendingPaymentRequest {
  userId: string;
  goalId: string;
  categoryId: string;
}

/**
 * 決済がキャンセルされた場合、一時的な決済データをクリア
 */
export const clearPendingPayment = onCall(
  { region: "asia-northeast1" },
  async (request) => {
    try {
      const { userId, goalId, categoryId } =
        request.data as ClearPendingPaymentRequest;

      // バリデーション
      if (!userId || !goalId || !categoryId) {
        throw new Error("Missing required parameters");
      }

      const db = getDb();
      const goalRef = db
        .collection("users")
        .doc(userId)
        .collection("category")
        .doc(categoryId)
        .collection("goals")
        .doc(goalId);

      const goalSnap = await goalRef.get();
      if (!goalSnap.exists) {
        throw new Error("Goal not found");
      }

      const goalData = goalSnap.data();

      // ロックされていない場合のみ、一時的な決済データをクリア
      if (!goalData?.isLocked) {
        await goalRef.update({
          paymentSessionId: FieldValue.delete(),
          betAmount: FieldValue.delete(),
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error clearing pending payment:", error);
      throw new Error(error.message || "Failed to clear pending payment");
    }
  },
);
