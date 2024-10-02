import { parseQuestion } from "./quizParser";

const multipleChoiceClassName = "cvqs-qs-ol";

async function start() {
  const quizElement = document.querySelector(`.${multipleChoiceClassName}`);

  for (const child of quizElement?.children || []) {
    console.log(parseQuestion(child as HTMLLIElement));
  }

  console.log(quizElement);
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  await start();
  sendResponse({ status: "success" });
});

console.log("mcv ai quiz content script loaded");
