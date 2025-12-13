import * as admin from "firebase-admin";
import {onCall} from "firebase-functions/v2/https";
import Stripe from "stripe";
import {FieldValue} from "firebase-admin/firestore";

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

interface ProcessRefundForGoalRequest {
  userId: string;
  goalId: string;
  categoryId: string;
}

/**
 * 目標の達成率に応じて返金処理を実行
 * 25%達成ごとに賭け金の25%を返還
 */
export const processRefundForGoal = onCall(
  {region: "asia-northeast1"},
  async (request) => {
    try {
      const {userId, goalId, categoryId} =
        request.data as ProcessRefundForGoalRequest;

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

      // 賭け金が設定されていない、またはロックされていない場合は返金しない
      if (
        !goalData?.betAmount ||
        !goalData?.isLocked ||
        !goalData?.paymentIntentId
      ) {
        return {
          success: true,
          refunded: false,
          message: "Goal is not eligible for refund",
        };
      }

      const betAmount = goalData.betAmount;
      const currentRatio = goalData.ratio || 0;
      const refundedPercentages = goalData.refundedPercentages || [];
      const paymentIntentId = goalData.paymentIntentId;

      // 返金すべきパーセンテージを計算（25%, 50%, 75%, 100%）
      const refundMilestones = [25, 50, 75, 100];
      const eligibleMilestones = refundMilestones.filter(
        (milestone) =>
          currentRatio >= milestone &&
          !refundedPercentages.includes(milestone),
      );

      if (eligibleMilestones.length === 0) {
        return {success: true, refunded: false, message: "No refund eligible"};
      }

      // 返金処理を実行
      const stripe = getStripe();
      const refundAmount = Math.floor(betAmount * 0.25); // 賭け金の25%
      const refundedMilestones: number[] = [];

      for (const milestone of eligibleMilestones) {
        try {
          // Stripeで返金を実行
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: refundAmount,
            reason: "requested_by_customer",
            metadata: {
              userId,
              goalId,
              categoryId,
              milestone: milestone.toString(),
              goalTitle: goalData.title || "目標",
            },
          });

          refundedMilestones.push(milestone);

          console.log(
            `Refund processed for goal ${goalId} ` +
            `at ${milestone}% milestone: ${refund.id}`,
          );
        } catch (error: any) {
          console.error(
            `Error processing refund for milestone ${milestone}:`,
            error,
          );
          // 一部の返金が失敗しても続行
        }
      }

      if (refundedMilestones.length > 0) {
        // 返金済みパーセンテージを更新
        await goalRef.update({
          refundedPercentages: FieldValue.arrayUnion(...refundedMilestones),
          lastRefundedAt: FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          refunded: true,
          refundedMilestones,
          refundAmount:
            refundAmount * refundedMilestones.length,
        };
      }

      return {
        success: true,
        refunded: false,
        message: "Refund processing failed",
      };
    } catch (error: any) {
      console.error("Error processing refund for goal:", error);
      throw new Error(error.message || "Failed to process refund for goal");
    }
  },
);

