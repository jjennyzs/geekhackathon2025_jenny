export type Goal = {
  title: string; //各目標のタイトル
  ratio: number; //目標の達成率
  betAmount?: number; //賭け金（円）
  isLocked?: boolean; //編集ロック状態（決済完了後はtrue）
  paymentIntentId?: string; //Stripe決済ID
};
