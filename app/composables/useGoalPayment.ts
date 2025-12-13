import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

export const useGoalPayment = () => {
  const functions = getFunctions(getApp());

  /**
   * 目標に賭ける金額でStripe決済セッションを作成
   * @param userId - ユーザーID
   * @param goalId - 目標ID
   * @param categoryId - カテゴリID
   * @param amount - 賭け金（円）
   * @returns Stripe Checkout Session URL
   */
  const createGoalPaymentSession = async (
    userId: string,
    goalId: string,
    categoryId: string,
    amount: number,
  ): Promise<string> => {
    try {
      const createPaymentSession = httpsCallable(
        functions,
        "api_stripe_createGoalPaymentSession",
      );
      const result = await createPaymentSession({
        userId,
        goalId,
        categoryId,
        amount,
        origin: window.location.origin,
      });

      const data = result.data as { url: string };
      return data.url;
    } catch (error) {
      console.error("Error creating payment session:", error);
      throw error;
    }
  };

  /**
   * Stripe Checkout Sessionを確認し、決済が完了していれば目標をロック
   * @param userId - ユーザーID
   * @param goalId - 目標ID
   * @param categoryId - カテゴリID
   * @param sessionId - Stripe Checkout Session ID
   * @returns ロック結果
   */
  const verifyAndLockGoal = async (
    userId: string,
    goalId: string,
    categoryId: string,
    sessionId: string,
  ): Promise<{ success: boolean; locked?: boolean; alreadyLocked?: boolean }> => {
    try {
      const verifyAndLock = httpsCallable(
        functions,
        "api_stripe_verifyAndLockGoal",
      );
      const result = await verifyAndLock({
        userId,
        goalId,
        categoryId,
        sessionId,
      });

      return result.data as { success: boolean; locked?: boolean; alreadyLocked?: boolean };
    } catch (error) {
      console.error("Error verifying and locking goal:", error);
      throw error;
    }
  };

  /**
   * 目標の達成率に応じて返金処理を実行
   * @param userId - ユーザーID
   * @param goalId - 目標ID
   * @param categoryId - カテゴリID
   * @returns 返金結果
   */
  const processRefundForGoal = async (
    userId: string,
    goalId: string,
    categoryId: string,
  ): Promise<{
    success: boolean;
    refunded: boolean;
    refundedMilestones?: number[];
    refundAmount?: number;
    message?: string;
  }> => {
    try {
      const processRefund = httpsCallable(
        functions,
        "api_stripe_processRefundForGoal",
      );
      const result = await processRefund({
        userId,
        goalId,
        categoryId,
      });

      return result.data as {
        success: boolean;
        refunded: boolean;
        refundedMilestones?: number[];
        refundAmount?: number;
        message?: string;
      };
    } catch (error) {
      console.error("Error processing refund for goal:", error);
      throw error;
    }
  };

  /**
   * 決済がキャンセルされた場合、一時的な決済データをクリア
   * @param userId - ユーザーID
   * @param goalId - 目標ID
   * @param categoryId - カテゴリID
   * @returns クリア結果
   */
  const clearPendingPayment = async (
    userId: string,
    goalId: string,
    categoryId: string,
  ): Promise<{ success: boolean }> => {
    try {
      const clearPayment = httpsCallable(
        functions,
        "api_stripe_clearPendingPayment",
      );
      const result = await clearPayment({
        userId,
        goalId,
        categoryId,
      });

      return result.data as { success: boolean };
    } catch (error) {
      console.error("Error clearing pending payment:", error);
      throw error;
    }
  };

  return {
    createGoalPaymentSession,
    verifyAndLockGoal,
    processRefundForGoal,
    clearPendingPayment,
  };
};

