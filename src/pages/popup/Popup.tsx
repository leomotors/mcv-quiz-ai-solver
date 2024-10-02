import OpenAI from "openai";
import { useEffect, useState } from "react";

export default function Popup(): JSX.Element {
  async function start() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || tab.id === undefined) {
      throw new Error("Tab not found");
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "start",
    });

    console.log({ response });
  }

  const [error, setError] = useState("");
  const [modelList, setModelList] = useState<string[]>([]);
  const [aiClient, setAiClient] = useState<OpenAI>();

  async function createOpenAIClient() {
    const { apiKey } = await chrome.storage.local.get("apiKey");

    if (!apiKey) {
      setError("Please set your OpenAI API Key in the options page");
      return undefined;
    }

    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    try {
      const mList = await client.models.list();
      setModelList(mList.data.map((m) => m.id));

      return client;
    } catch (e) {
      console.error(e);
      setError("Failed to fetch model list, is your API Key Valid?");
    }
  }

  useEffect(() => {
    async function init() {
      const client = await createOpenAIClient();
      setAiClient(client);
    }

    setError("init disabled to not rate limit lmao");
    // init();
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 flex h-full flex-col gap-4 bg-gray-800 p-3 text-center text-xl text-white">
      <h1 className="text-3xl font-bold">MCV AI Quiz</h1>

      <p>Click button to start</p>

      <label htmlFor="model">Model:</label>
      <select id="model" className="rounded-xl bg-gray-700 p-4">
        {modelList.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>

      <button onClick={start} className="rounded-xl bg-blue-300 p-4">
        Start
      </button>

      <button
        className="rounded-xl bg-gray-500 p-4"
        onClick={() => chrome.runtime.openOptionsPage()}
      >
        Open Options
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
