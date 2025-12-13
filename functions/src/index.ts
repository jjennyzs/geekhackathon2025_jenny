import admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import serviceAccount from "../config/serviceAccountKey.json";

// firebase-adminを初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

setGlobalOptions({ region: "asia-northeast1" });

process.env.TZ = "Asia/Tokyo";

interface FunctionsObj {
  [key: string]: string;
}

// ここに定義を追加していく
const funcs = {
  // API
  api_fireStore_exportJson: "./api/fireStore/exportJson",
  api_stripe_createGoalPaymentSession: "./api/stripe/createGoalPaymentSession",
  api_stripe_verifyAndLockGoal: "./api/stripe/verifyAndLockGoal",
  api_stripe_processRefundForGoal: "./api/stripe/processRefundForGoal",
  api_stripe_clearPendingPayment: "./api/stripe/clearPendingPayment",
};

const loadFunctions = (functionsObj: FunctionsObj) => {
  for (const functionName in functionsObj) {
    if (
      !process.env.FUNCTION_NAME ||
      process.env.FUNCTION_NAME.startsWith(functionName)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const importedModule = require(functionsObj[functionName]);
      // ES modulesのexport形式に対応（名前付きエクスポート）
      if (importedModule.exportJson) {
        module.exports[functionName] = importedModule.exportJson;
      } else if (importedModule.createGoalPaymentSession) {
        module.exports[functionName] = importedModule.createGoalPaymentSession;
      } else if (importedModule.verifyAndLockGoal) {
        module.exports[functionName] = importedModule.verifyAndLockGoal;
      } else if (importedModule.processRefundForGoal) {
        module.exports[functionName] = importedModule.processRefundForGoal;
      } else if (importedModule.clearPendingPayment) {
        module.exports[functionName] = importedModule.clearPendingPayment;
      } else {
        // CommonJS形式の場合（default exportなど）
        module.exports[functionName] = importedModule;
      }
    }
  }
};

loadFunctions(funcs);
