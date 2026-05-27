const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = {
  async health() { return (await fetch(`${BASE}/api/health`)).json(); },
  async models() { return (await fetch(`${BASE}/api/models`)).json(); },
  async test() { return (await fetch(`${BASE}/api/test`)).json(); },

  async analyze(files) {
    const res = await fetch(`${BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Analysis failed");
    return data;
  },
};

export default api;
