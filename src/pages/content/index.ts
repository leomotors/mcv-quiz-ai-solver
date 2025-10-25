import { isQuestionOk, parseQuestion, Question } from "./quizParser";
import OpenAI from "openai";

const apiPrices = {
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-5": { input: 1.25, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
} as Record<string, { input: number; output: number }>;

async function start(model: string) {
  const { apiKey } = await chrome.storage.local.get("apiKey");

  if (!apiKey) {
    throw new Error("Please set your OpenAI API Key in the options page");
  }

  const quizElement = document.querySelector(".cvqs-qs-ol");
  const questions: Array<{ question: Question; element: HTMLLIElement }> = [];
  const warningMsg: string[] = [];

  for (const child of quizElement?.children || []) {
    const q = parseQuestion(child as HTMLLIElement);

    if (isQuestionOk(q, warningMsg)) {
      questions.push({ question: q, element: child as HTMLLIElement });
    }
  }

  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  for (const { question, element } of questions) {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You will be answering questions in multiple choice format. You will only the answer in the exact format as shown in the options without any prefix or suffix. You cannot guess the answer, if you are unsure you must answer why you are unsure instead.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Question: ${question.question}\nAnswers:\n${question.answers.join("\n")}`,
            },
            ...question.imageSrcs.map((img) => ({
              type: "image_url" as const,
              image_url: {
                url: img,
              },
            })),
          ],
        },
      ],
    });

    const choice = response.choices[0];

    totalPromptTokens += response.usage?.prompt_tokens || 0;
    totalCompletionTokens += response.usage?.completion_tokens || 0;

    if (choice.message.refusal) {
      warningMsg.push(
        `Question #${question.qno} [AI REFUSAL]: ${choice.message.content}`,
      );
      continue;
    }

    const answer = question.answers.find(
      (c) => c === choice.message.content?.trim(),
    );

    console.log(`${question.question} = ${choice.message.content?.trim()}`);

    if (!answer) {
      warningMsg.push(
        `Question #${question.qno} [AI UNSURE]: AI answer ${choice.message.content} which is not found in the options`,
      );

      continue;
    }

    let foundAnswer = false;
    let clicked = false;

    element
      .querySelectorAll(".cvqs-answer-multiplechoice-choiceitem")
      .forEach((choice) => {
        const choiceText = choice.textContent?.trim();
        if (choiceText === answer) {
          foundAnswer = true;
          const targetInput = choice.querySelector("input");

          if (targetInput) {
            targetInput.click();
            clicked = true;
          }
        }
      });

    if (!foundAnswer) {
      warningMsg.push(
        `Question #${question.qno} [UI ISSUE]: Could not find answer ${answer} in the options`,
      );
    } else if (!clicked) {
      warningMsg.push(
        `Question #${question.qno} [UI ISSUE]: Cannot click answer ${answer}`,
      );
    }
  }

  return {
    totalPromptTokens,
    totalCompletionTokens,
    warningMsg,
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  async function runHandler() {
    try {
      console.log({ message });

      if (message.action !== "start") {
        throw new Error(`Unknown action: ${message.action}`);
      }

      const model = message.model;
      if (!model || typeof model !== "string") {
        throw new Error(`Invalid model: ${model}`);
      }

      const { totalPromptTokens, totalCompletionTokens, warningMsg } =
        await start(model);

      let responseMessage = `Total Prompt Tokens: ${totalPromptTokens}, Total Completion Tokens: ${totalCompletionTokens}`;

      const pricing = apiPrices[model];
      if (pricing) {
        const cost = (
          (totalPromptTokens * pricing.input) / 1000000 +
          (totalCompletionTokens * pricing.output) / 1000000
        ).toFixed(6);
        responseMessage += `, Estimated Cost: $${cost}`;
      }

      const warningMessage = warningMsg.join("\n");

      console.log(responseMessage);
      if (warningMessage) console.warn(warningMessage);

      sendResponse({
        status: "success",
        message: responseMessage,
        warning: warningMessage,
      });
    } catch (e) {
      console.error(e);
      sendResponse({ status: "error", message: `${e}` });
    }
  }

  runHandler();
  return true;
});

console.log("mcv ai quiz content script loaded");
