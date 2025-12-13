import * as admin from "firebase-admin";
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

interface CreateGoalPaymentSessionRequest {
  userId: string;
  goalId: string;
  categoryId: string;
  amount: number; // 賭け金（円）
  origin?: string; // フロントエンドのオリジン（オプション）
}

/**
 * 目標に賭ける金額でStripe決済セッションを作成
 */
export const createGoalPaymentSession = onCall(
  { region: "asia-northeast1" },
  async (request) => {
    try {
      const { userId, goalId, categoryId, amount, origin } =
        request.data as CreateGoalPaymentSessionRequest;

      // バリデーション
      if (!userId || !goalId || !categoryId || !amount) {
        throw new Error("Missing required parameters");
      }

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // 目標が存在するか確認
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
      if (goalData?.isLocked) {
        throw new Error("Goal is already locked");
      }

      // 現在のURLを取得（成功/キャンセル時のリダイレクト先）
      // onCallではrawRequestに直接アクセスできないため、環境変数またはデフォルト値を使用
      // const origin = process.env.FRONTEND_URL || "http://localhost:3000";
      const successUrl =
        `${origin}/users/${userId}/payment/success?` +
        "session_id={CHECKOUT_SESSION_ID}&" +
        `goal_id=${goalId}&category_id=${categoryId}`;
      const cancelUrl =
        `${origin}/users/${userId}/payment/cancel?` +
        `goal_id=${goalId}&category_id=${categoryId}`;

      // Stripe Checkout Sessionを作成
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: `目標達成への賭け: ${goalData?.title || "目標"}`,
                description: `目標「${goalData?.title || "目標"}」の達成に賭ける金額`,
              },
              unit_amount: amount, // 金額（円）
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          goalId,
          categoryId,
          type: "goal_payment",
        },
      });

      // 目標に決済情報を一時的に保存（セッションID）
      await goalRef.update({
        paymentSessionId: session.id,
        betAmount: amount,
      });

      return { url: session.url };
    } catch (error: any) {
      console.error("Error creating payment session:", error);
      throw new Error(error.message || "Failed to create payment session");
    }
  },
);
