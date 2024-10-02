import { useState } from "react";

export default function Options(): JSX.Element {
  const [apiKey, setApiKey] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function saveSettings() {
    try {
      await chrome.storage.local.set({ apiKey });
      setSuccess("API Key saved successfully");
      setApiKey("");
    } catch (e) {
      setError(`${e}`);
    }
  }

  return (
    <div className="container flex flex-col items-center gap-2 p-4 text-xl">
      <h1 className="text-3xl font-bold">Options</h1>

      <label htmlFor="apikey">OpenAI API Key</label>
      <input
        id="apikey"
        type="password"
        className="rounded-lg border border-black p-4"
        value={apiKey}
        onChange={(e) => setApiKey(e.currentTarget.value)}
      />

      <button
        className="rounded-xl bg-red-500 p-4 font-bold"
        onClick={saveSettings}
      >
        Set API Key
      </button>

      {success && <p className="text-green-500">{success}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
