import { useState } from "react";

const BACKEND_URL = "http://10.50.133.132:8000";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Failed to connect to forensic backend. Ensure FastAPI is running on port 8000.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setAnalyzing(false);
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case "likely authentic":
        return { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "✓" };
      case "inconclusive":
        return { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "⚠" };
      default:
        return { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: "⚠" };
    }
  };

  return (
    <div className="min-h-screen bg-[#080812] text-white font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="text-2xl font-bold tracking-tight">
          <span className="text-purple-400">Deep</span>Trace
        </div>
        <div className="text-sm text-gray-400">AI Media Forensics</div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-12 pb-20">
        <div className="text-center">
          <div className="inline-block px-4 py-2 mb-6 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm">
            ✦ AI-POWERED MEDIA FORENSICS
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Detect what's{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              not real.
            </span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Analyze visual media for synthetic generation signatures, manipulation boundaries, and metadata anomalies.
          </p>
        </div>

        {/* Upload Zone */}
        {!file && (
          <div className="mt-12">
            <label htmlFor="file-upload" className="block cursor-pointer">
              <div className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-500/5 hover:bg-purple-500/10 rounded-3xl p-16 text-center transition duration-300">
                <div className="text-5xl mb-6">↑</div>
                <h2 className="text-2xl font-semibold mb-3">Upload media for forensic audit</h2>
                <p className="text-gray-400 mb-6">Select or drag and drop an image or video</p>
                <span className="inline-block px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold transition">
                  Choose File
                </span>
                <p className="text-gray-500 text-sm mt-5">JPG • PNG • WEBP • MP4 • MOV</p>
              </div>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Media Preview & Pre-analysis State */}
        {file && !result && (
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-semibold text-gray-200">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={reset} className="text-gray-400 hover:text-white p-2">✕</button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black mb-6 flex items-center justify-center">
                {file.type.startsWith("image/") ? (
                  <img src={preview} alt="Preview" className="w-full max-h-[450px] object-contain" />
                ) : (
                  <video src={preview} controls className="w-full max-h-[450px]" />
                )}
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-95 font-semibold text-lg disabled:opacity-50 transition shadow-lg shadow-purple-900/20"
              >
                {analyzing ? "Running Forensic Models..." : "Analyze Media"}
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {analyzing && (
          <div className="text-center mt-12">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300 font-medium">Extracting features and running detection checks...</p>
            <p className="text-gray-500 text-sm mt-1">Comparing frequency spectrums and verifying artifacts</p>
          </div>
        )}

        {/* Live Analysis Results */}
        {result && (
          <div className="mt-10 max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              {/* Verdict Banner */}
              <div className="text-center mb-8">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Verdict</p>
                <h2 className={`text-4xl font-bold uppercase tracking-wide mb-2 ${getVerdictStyle(result.overall_verdict).color}`}>
                  {getVerdictStyle(result.overall_verdict).icon} {result.overall_verdict.replace("_", " ")}
                </h2>
                <p className="text-gray-400 text-sm">
                  Composite Risk Score:{" "}
                  <span className="text-white font-semibold">
                    {(result.overall_score * 100).toFixed(1)}%
                  </span>
                  <span className="text-gray-600 mx-2">•</span>
                  Processed in <span className="text-gray-300">{result.processing_time_ms}ms</span>
                </p>
              </div>

              {/* Forensic Metric Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <ResultCard title="AI Generation" check={result.checks.ai_generation} />
                <ResultCard title="Face Manipulation" check={result.checks.face_manipulation} />
                <ResultCard title="Metadata Anomaly" check={result.checks.metadata_anomaly} />
                <ResultCard title="Compression Inconsistency" check={result.checks.compression_inconsistency} />
              </div>

              {/* Heatmap Visualization */}
              {result.heatmap_image_url && (
                <div className="border border-white/10 rounded-2xl p-5 bg-black/40 mb-8">
                  <p className="text-sm font-semibold text-gray-300 mb-3">Attention / Anomaly Heatmap</p>
                  <div className="rounded-xl overflow-hidden bg-black flex justify-center">
                    <img
                      src={`${BACKEND_URL}${result.heatmap_image_url}`}
                      alt="Forensic Heatmap"
                      className="w-full max-h-[400px] object-contain"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition font-semibold"
              >
                Analyze Another File
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-xs">
        DeepTrace Forensic Engine • Hackathon Build
      </footer>
    </div>
  );
}

function ResultCard({ title, check }) {
  if (!check) return null;

  const percentage = Math.round(check.score * 100);
  
  const getBadgeColor = (lvl) => {
    switch (lvl) {
      case "HIGH":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "MEDIUM":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      default:
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-300 font-medium text-sm">{title}</p>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getBadgeColor(check.level)}`}>
            {check.level}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{check.explanation}</p>
      </div>

      <div>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;