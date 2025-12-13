import OpenAI from "openai";
import { onCall } from "firebase-functions/v2/https";

// 型定義
interface TodoDoc {
  task: string;
  isFinished: boolean;
  weight?: number;
}

interface StepWithChildren {
  id: string;
  title: string;
  steps: StepWithChildren[];
  todos?: TodoWithId[];
}

interface TodoWithId extends TodoDoc {
  id: string;
}

interface GoalWithSteps {
  id: string;
  title: string;
  ratio: number;
  steps: StepWithChildren[];
  todos?: TodoWithId[];
}

// OpenAI APIクライアントの初期化
const initOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log(
    "OPENAI_API_KEY loaded:",
    apiKey ? "Yes (length: " + apiKey.length + ")" : "No"
  );
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY環境変数が設定されていません");
  }
  return new OpenAI({ apiKey });
};

/**
 * ランダムなIDを生成する関数
 */
function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * OpenAI APIを使用してタスクリストを生成する関数
 */
async function generateTaskList(prompt: string): Promise<GoalWithSteps> {
  const openai = initOpenAI();

  const systemPrompt = `あなたはタスク管理のエキスパートです。
ユーザーの入力から、階層的なゴール・ステップ・タスク構造を生成してください。

出力フォーマットはJSON形式で、以下の構造に従ってください:
{
  "id": "一意のID",
  "title": "ゴールのタイトル",
  "ratio": 0,
  "steps": [
    {
      "id": "一意のID",
      "title": "ステップのタイトル",
      "steps": [
        {
          "id": "一意のID",
          "title": "サブステップのタイトル",
          "steps": [],
          "todos": [
            {
              "id": "一意のID",
              "task": "具体的なタスク内容",
              "isFinished": false,
              "weight": 1
            }
          ]
        }
      ],
      "todos": []
    }
  ],
  "todos": []
}

重要なルール:
1. ゴールは大きな目標を表します
2. ステップは中規模の実行項目です（複数階層可能）
3. todosは具体的な作業タスクです
4. ratioは常に0から始めます
5. isFinishedは常にfalseから始めます
6. weightは重要度を表し、通常は1です
7. 階層は論理的に構造化してください
8. IDは重複しないようにしてください
9. JSON以外の説明文は含めないでください
10. 必ずJSON形式のみを返してください

ユーザーの入力: ${prompt}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("OpenAI APIからの応答が空です");
    }

    // JSONをパース
    const parsedData = JSON.parse(text) as GoalWithSteps;

    // IDが設定されていない場合は生成
    if (!parsedData.id) {
      parsedData.id = generateId();
    }

    // 再帰的にIDを設定
    const ensureIds = (steps: StepWithChildren[]) => {
      for (const step of steps) {
        if (!step.id) {
          step.id = generateId();
        }
        if (step.todos) {
          for (const todo of step.todos) {
            if (!todo.id) {
              todo.id = generateId();
            }
          }
        }
        if (step.steps && step.steps.length > 0) {
          ensureIds(step.steps);
        }
      }
    };

    if (parsedData.steps) {
      ensureIds(parsedData.steps);
    }

    if (parsedData.todos) {
      for (const todo of parsedData.todos) {
        if (!todo.id) {
          todo.id = generateId();
        }
      }
    }

    return parsedData;
  } catch (error: any) {
    console.error("OpenAI API呼び出しエラー:", error);
    throw new Error(`タスクリストの生成に失敗しました: ${error.message}`);
  }
}

/**
 * Cloud Function: ユーザーの入力からタスクリストを生成
 */
export const generateTaskListFromPrompt = onCall(
  {
    cors: ["http://localhost:3000", "http://127.0.0.1:3000"],
    region: "asia-northeast1",
  },
  async (request) => {
    console.log(
      "generateTaskListFromPrompt called with prompt:",
      request.data.prompt
    );

    const { prompt } = request.data;

    if (!prompt) {
      console.error("Error: promptが提供されていません");
      throw new Error("promptは必須です");
    }

    try {
      const taskList = await generateTaskList(prompt);
      console.log("タスクリスト生成成功");
      return {
        success: true,
        data: taskList,
      };
    } catch (error: any) {
      console.error("タスクリスト生成エラー:", error);
      console.error("Error stack:", error.stack);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }
);
