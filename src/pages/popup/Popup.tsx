import OpenAI from "openai";
import { useEffect, useState } from "react";

export default function Popup(): JSX.Element {
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [modelList, setModelList] = useState<string[]>([]);
  const [, setAiClient] = useState<OpenAI>();
  const [model, setModel] = useState<string>();
  const [loading, setLoading] = useState(false);

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
      const preferedModels = ["gpt-4.1", "gpt-5", "gpt-4o-mini"];
      const modelIds = mList.data.map((m) => m.id);
      const prioritySorted = modelIds.sort((a, b) => {
        const aIndex = preferedModels.indexOf(a);
        const bIndex = preferedModels.indexOf(b);

        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
      });
      setModelList(prioritySorted);
      setModel(prioritySorted[0]);

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

    init();
  }, []);

  async function start() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || tab.id === undefined) {
      setError("Tab not found");
      throw new Error("Tab not found");
    }

    setLoading(true);

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "start",
      model,
    });

    setLoading(false);

    console.log({ response });

    if (response.status === "error") {
      setError(response.message);
      return;
    }

    setSuccess(response.message);
    setWarning(response.warning);
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 flex h-full flex-col gap-4 overflow-y-scroll bg-gray-800 p-3 text-center text-lg text-white">
      <h1 className="text-2xl font-bold">MCV Quiz AI Solver</h1>

      <label htmlFor="model">Model:</label>
      <select
        id="model"
        className="rounded-xl bg-gray-700 p-4"
        value={model}
        onChange={(e) => setModel(e.target.value)}
      >
        {modelList.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>

      <button
        onClick={start}
        className="rounded-xl bg-blue-300 p-4 disabled:bg-gray-500 disabled:hover:cursor-not-allowed"
        disabled={loading || !model}
      >
        Start
      </button>

      <button
        className="rounded-xl bg-gray-500 p-4"
        onClick={() => chrome.runtime.openOptionsPage()}
      >
        Open Options
      </button>

      {success && <p className="text-green-500">{success}</p>}
      {warning && <p className="text-yellow-500">{warning}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
