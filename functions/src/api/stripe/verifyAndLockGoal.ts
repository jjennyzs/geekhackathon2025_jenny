import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import Stripe from "stripe";

const getDb = () => admin.firestore();

// Stripeの初期化（環境変数が設定されている場合のみ）
const getStripe = () => {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-02-24.acacia",
  });
};

interface VerifyAndLockGoalRequest {
  userId: string;
  goalId: string;
  categoryId: string;
  sessionId: string;
}

/**
 * Stripe Checkout Sessionを確認し、決済が完了していれば目標をロック
 */
export const verifyAndLockGoal = onCall(
  { region: "asia-northeast1" },
  async (request) => {
    try {
      const { userId, goalId, categoryId, sessionId } =
        request.data as VerifyAndLockGoalRequest;

      // バリデーション
      if (!userId || !goalId || !categoryId || !sessionId) {
        throw new Error("Missing required parameters");
      }

      // Stripe Checkout Sessionを取得
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // 決済が完了していない場合はエラー
      if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
      }

      // メタデータを確認
      const {
        userId: sessionUserId,
        goalId: sessionGoalId,
        categoryId: sessionCategoryId,
      } = session.metadata || {};

      if (
        sessionUserId !== userId ||
        sessionGoalId !== goalId ||
        sessionCategoryId !== categoryId
      ) {
        throw new Error("Session metadata does not match");
      }

      // 目標をロック
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

      // 既にロックされている場合は成功として返す
      if (goalData?.isLocked) {
        return { success: true, alreadyLocked: true };
      }

      // 目標をロックし、決済情報を保存
      await goalRef.update({
        isLocked: true,
        paymentIntentId: session.payment_intent as string,
        paymentCompletedAt: FieldValue.serverTimestamp(),
        paymentSessionId: sessionId,
      });

      return { success: true, locked: true };
    } catch (error: any) {
      console.error("Error verifying and locking goal:", error);
      throw new Error(error.message || "Failed to verify and lock goal");
    }
  },
);
