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

  return {
    createGoalPaymentSession,
    verifyAndLockGoal,
  };
};

