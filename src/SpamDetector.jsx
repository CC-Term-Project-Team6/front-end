import { useState, useRef, useEffect } from "react";

const BASE_URL = "https://smishingdet-functions.azurewebsites.net/api";

/*
const MOCK_RESULTS = {
  spam: {
    result: "spam",
    confidence: 0.97,
    reason: "가족 사칭 스미싱 패턴 감지됨. 금전 요청 및 긴급 상황 유도 문구 포함.",
    keywords: ["폰 고장", "상품권", "급해", "엄마"],
  },
  suspicious: {
    result: "suspicious",
    confidence: 0.61,
    reason: "의심스러운 URL 포함. 발신자 정보 불명확. 추가 확인 권장.",
    keywords: ["링크 클릭", "본인 인증", "이벤트 당첨"],
  },
  safe: {
    result: "safe",
    confidence: 0.94,
    reason: "정상적인 메시지 패턴. 스팸/피싱 특징 미감지.",
    keywords: [],
  },
};


const HISTORY = [
  { id: 1, preview: "엄마 나 폰 고장나서...", result: "spam", time: "14:23" },
  { id: 2, preview: "택배 배송 완료 안내입니다", result: "safe", time: "13:11" },
  { id: 3, preview: "계좌 이체 요청드립니다", result: "suspicious", time: "11:47" },
  { id: 4, preview: "[이벤트] 당첨되셨습니다!", result: "spam", time: "10:02" },
];
*/

const VERDICT = {
  spam: { label: "스팸 / 피싱", color: "#ff4444", bg: "rgba(255,68,68,0.08)", icon: "⚠" },
  suspicious: { label: "의심", color: "#ffaa00", bg: "rgba(255,170,0,0.08)", icon: "?" },
  normal: { label: "정상", color: "#00e5a0", bg: "rgba(0,229,160,0.08)", icon: "✓" },
};

function formatTime(iso) {
  if (!iso) return "";
  iso = iso.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
}

export default function SpamDetector() {
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistory, setActiveHistory] = useState(null);
  const fileRef = useRef();

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/history`);
      const data = await res.json();
      setHistory(data.items || []);
    } catch {
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

const analyze = async () => {
  if (tab === "text" && !text.trim()) return;
  if (tab === "image" && !image) return;
  setAnalyzing(true);
  setResult(null);

  try {
    let res;

    if (tab === "text") {
      // 텍스트: JSON으로 전송
      res = await fetch(`${BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      });

    } else {
      // 이미지: FormData로 전송
      const formData = new FormData();
      formData.append("type", "image");
      formData.append("file", image);

      res = await fetch(`${BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
    }

    const data = await res.json();
    setResult(data);
    fetchHistory();

  } catch (err) {
    console.error(err);
  } finally {
    setAnalyzing(false);
  }
};

  const verdict = result ? VERDICT[result.label] ?? VERDICT.normal : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0c10",
      color: "#e0e6f0",
      fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111418; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 2px; }

        .tab-btn {
          padding: 8px 22px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: #5a6880;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.03em;
        }
        .tab-btn.active {
          background: #161b26;
          border-color: #2a3550;
          color: #c0cce0;
        }
        .tab-btn:hover:not(.active) { color: #8090a8; }

        .analyze-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #1a4fd8 0%, #0d3ab0 100%);
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .analyze-btn:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .analyze-btn:active { transform: translateY(0); }
        .analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .history-item {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #1a2030;
          background: #0e1218;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 6px;
        }
        .history-item:hover, .history-item.active {
          border-color: #2a3550;
          background: #131820;
        }

        .keyword-tag {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-family: 'Space Mono', monospace;
          margin: 3px 3px 3px 0;
        }

        .drop-zone {
          border: 2px dashed #2a3550;
          border-radius: 10px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #0c1018;
        }
        .drop-zone:hover { border-color: #3a5080; background: #0e1422; }

        .scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #1a4fd8, transparent);
          animation: scan 1.4s ease-in-out infinite;
          top: 0; left: 0;
        }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .result-card { animation: fadeIn 0.4s ease-out; }

        .confidence-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .grid-bg {
          background-image: linear-gradient(#1a2535 1px, transparent 1px),
                            linear-gradient(90deg, #1a2535 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.18;
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #161c28",
        padding: "0 32px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "rgba(10,12,16,0.95)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", color: "#d0daf0" }}>
            피싱 문자 판별
          </span>
        </div>
      </header>

      {/* Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <aside style={{
          width: 220,
          borderRight: "1px solid #161c28",
          padding: "24px 16px",
          overflow: "auto",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: "#3a4860", letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>
            RECENT HISTORY
          </div>
          {history.length === 0 && (
            <div style={{ fontSize: 11, color: "#2a3550", textAlign: "center", marginTop: 20 }}>이력 없음</div>
          )}
          {history.map(h => {
            const v = VERDICT[h.label] ?? VERDICT.normal;
            return (
              <div
                key={h.id}
                className={`history-item${activeHistory === h.id ? " active" : ""}`}
                onClick={() => setActiveHistory(h.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: v.color, opacity: 0.8 }}>
                    {v.label}
                  </span>
                  <span style={{ fontSize: 10, color: "#3a4860" }}>{formatTime(h.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#6a7890", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {h.original_text || `[${h.input_type}]`}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Center */}
        <main style={{ flex: 1, padding: "32px 40px", overflow: "auto", position: "relative" }}>
          <div className="grid-bg" />

          <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
            <h1 style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#c8d6f0",
              marginBottom: 6,
              letterSpacing: "-0.01em",
            }}>메시지 분석</h1>
            <p style={{ fontSize: 13, color: "#4a5870", marginBottom: 28, lineHeight: 1.6 }}>
              의심스러운 문자·메시지를 붙여넣거나 스크린샷을 업로드하세요.
            </p>

            {/* Tab */}
            <div style={{
              display: "flex",
              gap: 6,
              background: "#0d1118",
              border: "1px solid #1a2030",
              borderRadius: 8,
              padding: 4,
              marginBottom: 20,
              width: "fit-content",
            }}>
              <button className={`tab-btn${tab === "text" ? " active" : ""}`} onClick={() => setTab("text")}>
                ✏ 텍스트 입력
              </button>
              <button className={`tab-btn${tab === "image" ? " active" : ""}`} onClick={() => setTab("image")}>
                🖼 이미지 업로드
              </button>
            </div>

            {/* Input area */}
            {tab === "text" ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="분석할 메시지를 붙여넣으세요..."
                rows={7}
                style={{
                  width: "100%",
                  background: "#0d1118",
                  border: "1px solid #1e2838",
                  borderRadius: 10,
                  padding: "16px 18px",
                  color: "#c0cce0",
                  fontSize: 14,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  resize: "vertical",
                  outline: "none",
                  lineHeight: 1.8,
                  transition: "border-color 0.2s",
                  marginBottom: 16,
                }}
                onFocus={e => e.target.style.borderColor = "#2a4080"}
                onBlur={e => e.target.style.borderColor = "#1e2838"}
              />
            ) : (
              <div
                className="drop-zone"
                style={{ marginBottom: 16 }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleImageDrop}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageDrop} />
                {imagePreview ? (
                  <div>
                    <img src={imagePreview} alt="preview" style={{ maxHeight: 180, borderRadius: 6, marginBottom: 10 }} />
                    <p style={{ fontSize: 12, color: "#4a5870" }}>{image?.name}</p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📷</div>
                    <p style={{ fontSize: 14, color: "#4a5870", marginBottom: 4 }}>이미지를 드래그하거나 클릭하여 업로드</p>
                    <p style={{ fontSize: 12, color: "#2a3550" }}>PNG, JPG, JPEG 지원</p>
                  </>
                )}
              </div>
            )}

            <button
              className="analyze-btn"
              onClick={analyze}
              disabled={analyzing || (tab === "text" ? !text.trim() : !image)}
            >
              {analyzing ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  분석 중...
                </span>
              ) : "분석 시작 →"}
              {analyzing && <span className="scan-line" />}
            </button>

            {/* Result */}
            {analyzing && (
              <div style={{ marginTop: 24, padding: "20px", background: "#0d1118", border: "1px solid #1a2535", borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#3a5080", letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace" }}>
                  AI 분석 중...
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
                  {["전처리", "KLUE-BERT", "Azure AI", "종합 판정"].map((s, i) => (
                    <div key={s} style={{
                      fontSize: 10,
                      padding: "4px 10px",
                      borderRadius: 4,
                      background: "#111820",
                      border: "1px solid #1e2838",
                      color: "#3a5070",
                      animation: `fadeIn 0.3s ${i * 0.25}s both`,
                    }}>{s}</div>
                  ))}
                </div>
              </div>
            )}

            {result && !analyzing && (
              <div
                className="result-card"
                style={{
                  marginTop: 24,
                  background: verdict.bg,
                  border: `1px solid ${verdict.color}30`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {/* Verdict header */}
                <div style={{
                  padding: "18px 24px",
                  borderBottom: `1px solid ${verdict.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 36, height: 36,
                      borderRadius: "50%",
                      background: `${verdict.color}15`,
                      border: `2px solid ${verdict.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                      color: verdict.color,
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 700,
                    }}>{verdict.icon}</span>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: verdict.color, letterSpacing: "0.02em" }}>
                        {verdict.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#4a5870", marginTop: 1 }}>판정 완료</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 28,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      color: verdict.color,
                    }}>{Math.round(result.confidence * 100)}<span style={{ fontSize: 14, opacity: 0.6 }}>%</span></div>
                    <div style={{ fontSize: 10, color: "#3a4860", letterSpacing: "0.1em" }}>CONFIDENCE</div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div style={{ padding: "12px 24px 0", background: "#0a0e16" }}>
                  <div style={{ height: 4, background: "#1a2030", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      className="confidence-bar-fill"
                      style={{ width: `${result.confidence * 100}%`, background: verdict.color }}
                    />
                  </div>
                </div>

                {/* reason 배열 */}
                <div style={{ padding: "18px 24px", background: "#0a0e16" }}>
                  <div style={{ fontSize: 10, color: "#3a4860", letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
                    REASON
                  </div>
                  {result.reason && result.reason.length > 0 ? (
                    result.reason.map((r, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#8090a8", lineHeight: 1.7 }}>• {r}</div>
                    ))
                  ) : (
                    <div style={{ fontSize: 13, color: "#3a4860" }}>탐지된 이유 없음 (AI 모델 연결 대기 중)</div>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  padding: "12px 24px",
                  background: "#080b12",
                  borderTop: "1px solid #161c28",
                  display: "flex",
                  gap: 10,
                }}>
                  <button
                    onClick={() => { setResult(null); setText(""); setImage(null); setImagePreview(null); }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "1px solid #1e2838",
                      background: "transparent",
                      color: "#5a6880",
                      fontSize: 12,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}>초기화</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}