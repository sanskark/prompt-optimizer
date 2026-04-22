import { useState, useEffect } from 'react';

function App() {
  const [draft, setDraft] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanData, setScanData] = useState(null);
  const [scanning, setScanning] = useState(false);

  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState('');
  const [temp, setTemp] = useState(1.0);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/models');
        const data = await response.json();
        setModels(data.models);
        if (data.models.length > 0) setModelId(data.models[0].id); // Default to first model
      } catch (err) {
        console.error("Failed to load models:", err);
      }
    };
    fetchModels();
  }, []);

  const runSecurityScan = async () => {
    if (!result?.optimized_prompt) return;
    setScanning(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: result.optimized_prompt, model_id: modelId }),
      });
      const data = await response.json();
      setScanData(data);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
    }
  };

  const handleOptimize = async () => {
    if (!draft.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setOriginalPrompt(draft);

    try {
      const response = await fetch('http://localhost:8000/api/v1/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: draft,
          model_id: modelId,
          temperature: temp
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">⚡ Prompt Optimizer</h1>
          <p className="text-gray-600">Elevate your raw prompts into highly-engineered instructions.</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex space-x-6 items-center justify-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">Model:</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="text-sm border border-gray-300 rounded p-1 outline-none"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 flex-grow max-w-xs">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Temp ({temp}):</label>
            <input
              type="range" min="0" max="2" step="0.1"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your raw prompt here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
          <button
            onClick={handleOptimize}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing & Engineering...' : 'Optimize Prompt'}
          </button>

          {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fade-in-up">

            {/* Score Dashboard */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Analysis Dashboard</h2>
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-semibold">Overall Score</span>
                <span className={`text-2xl font-bold ${result.scores.total > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {result.scores.total}/100
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500">Clarity</div>
                  <div className="text-lg font-semibold">{result.scores.clarity}/25</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500">Context</div>
                  <div className="text-lg font-semibold">{result.scores.context}/25</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500">Constraints</div>
                  <div className="text-lg font-semibold">{result.scores.constraints}/25</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500">Persona</div>
                  <div className="text-lg font-semibold">{result.scores.persona}/25</div>
                </div>
              </div>
            </div>

            {/* Telemetry & Cost Analytics */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between text-sm">
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">⏱️ Latency:</span>
                  <span className="font-mono font-medium text-gray-800">{result.analytics.latency_ms}ms</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">📥 Prompt Tokens:</span>
                  <span className="font-mono font-medium text-gray-800">{result.analytics.prompt_tokens}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">📤 Output Tokens:</span>
                  <span className="font-mono font-medium text-gray-800">{result.analytics.completion_tokens}</span>
                </div>
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                <span className="text-gray-600 font-medium">Total: {result.analytics.total_tokens} tokens</span>
              </div>
            </div>

            {/* Critique & Output */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-blue-900">
              <h3 className="font-bold mb-2 flex items-center">💡 Expert Critique</h3>
              <p className="text-sm leading-relaxed">{result.critique}</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl shadow-lg relative group">
              <h3 className="text-gray-400 font-semibold mb-3 text-sm tracking-wider uppercase">✨ Optimized Prompt</h3>
              <button
                onClick={() => navigator.clipboard.writeText(result.optimized_prompt)}
                className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 text-sm rounded transition-colors"
              >
                Copy
              </button>
              <pre className="text-gray-100 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {result.optimized_prompt}
              </pre>
            </div>

            <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Security Audit</h3>
                  <p className="text-xs text-gray-500">Adversarial Red-Teaming Simulation</p>
                </div>
                <button
                  onClick={runSecurityScan}
                  disabled={scanning || !result}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {scanning ? "Simulating Attacks..." : "Run Security Scan"}
                </button>
              </div>

              {scanData ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Safety Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-600 uppercase tracking-tighter">Safety Rating</span>
                      <span className={`text-2xl font-black ${scanData.safety_score > 75 ? 'text-green-600' : 'text-red-600'}`}>
                        {scanData.safety_score}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div
                        className={`h-full transition-all duration-1000 ${scanData.safety_score > 75 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${scanData.safety_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Detailed Results Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {scanData.results.map((res, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">{res.type}</span>
                        <span className={`text-[10px] font-black px-2 py-1 rounded ${res.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {res.passed ? "✓ SECURE" : "✗ VULNERABLE"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-xs text-gray-400 italic">Click the button to test this prompt against common injection attacks.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;
