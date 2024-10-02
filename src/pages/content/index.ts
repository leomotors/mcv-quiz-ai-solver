import { isQuestionOk, parseQuestion, Question } from "./quizParser";
import OpenAI from "openai";

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
            "You will be answering questions in multiple choice format. You will only the answer in the exact format as shown in the options. You cannot guess the answer, if you are unsure you must answer why you are unsure instead.",
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

    if (!answer) {
      warningMsg.push(
        `Question #${question.qno} [AI UNSURE]: AI answer ${choice.message.content} which is not found in the options`,
      );
    }

    element
      .querySelectorAll(".cvqs-answer-multiplechoice-choiceitem")
      .forEach((choice) => {
        const choiceText = choice.textContent?.trim();
        if (choiceText === answer) {
          choice.querySelector("input")?.click();
        }
      });
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

      sendResponse({
        status: "success",
        message: `Total Prompt Tokens: ${totalPromptTokens}, Total Completion Tokens: ${totalCompletionTokens}`,
        warning: warningMsg.join("\n"),
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
