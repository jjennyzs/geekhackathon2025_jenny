import admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';
import serviceAccount from '../config/serviceAccountKey.json';

// firebase-adminを初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

setGlobalOptions({ region: 'asia-northeast1' });

process.env.TZ = 'Asia/Tokyo';

interface FunctionsObj {
  [key: string]: string;
}

// ここに定義を追加していく
const funcs = {
  // API
  api_fireStore_exportJson: './api/fireStore/exportJson',
  api_fireStore_importJson: './api/fireStore/importJson',
};

const loadFunctions = (functionsObj: FunctionsObj) => {
  for (const functionName in functionsObj) {
    if (
      !process.env.FUNCTION_NAME ||
      process.env.FUNCTION_NAME.startsWith(functionName)
    ) {
      const importedModule = require(functionsObj[functionName]);
      // ES modulesのexport形式に対応（exportJson, importJsonなど名前付きエクスポート）
      if (importedModule.exportJson) {
        module.exports[functionName] = importedModule.exportJson;
      } else if (importedModule.importJson) {
        module.exports[functionName] = importedModule.importJson;
      } else {
        // CommonJS形式の場合（default exportなど）
        module.exports[functionName] = importedModule;
      }
    }
  }
};

loadFunctions(funcs);
