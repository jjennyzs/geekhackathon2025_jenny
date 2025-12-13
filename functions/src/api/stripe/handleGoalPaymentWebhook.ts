import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";
import Stripe from "stripe";

// Stripeの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

const getDb = () => admin.firestore();

/**
 * Stripe決済完了後のwebhookハンドラー
 * 決済が成功したら目標をロックする
 */
export const handleGoalPaymentWebhook = onRequest(
  {region: "asia-northeast1", cors: true},
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      res.status(400).send("No signature");
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      res.status(500).send("Webhook secret not configured");
      return;
    }

    let event: Stripe.Event;

    try {
      // Firebase Functions v2では、req.bodyが既にパースされている可能性がある
      // raw bodyを取得するために、req.rawBodyまたはBufferから取得を試みる
      let rawBody: string | Buffer;

      if ((req as any).rawBody) {
        rawBody = (req as any).rawBody;
      } else if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
      } else if (typeof req.body === "string") {
        rawBody = req.body;
      } else {
        // JSONとしてパースされている場合は、再度文字列化
        rawBody = JSON.stringify(req.body);
      }

      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret,
      ) as Stripe.Event;
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // 決済成功時の処理
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // メタデータから情報を取得
      const {userId, goalId, categoryId} = session.metadata || {};

      if (!userId || !goalId || !categoryId) {
        console.error("Missing metadata in session");
        res.status(400).send("Missing metadata");
        return;
      }

      try {
        const db = getDb();
        const goalRef = db
          .collection("users")
          .doc(userId)
          .collection("category")
          .doc(categoryId)
          .collection("goals")
          .doc(goalId);

        // 目標をロックし、決済情報を保存
        await goalRef.update({
          isLocked: true,
          paymentIntentId: session.payment_intent as string,
          paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(
          `Goal ${goalId} locked after successful payment for user ${userId}`,
        );
        res.status(200).send({received: true});
      } catch (error: any) {
        console.error("Error updating goal after payment:", error);
        res.status(500).send(`Error: ${error.message}`);
      }
    } else {
      res.status(200).send({received: true});
    }
  },
);

