import { useState, useRef, useEffect } from "react";

const BASE_URL = "https://smishingdet-functions.azurewebsites.net/api";

const VERDICT = {
  spam: { label: "스팸 / 피싱", color: "#d93025", bg: "rgba(217,48,37,0.08)", icon: "⚠" },
  suspicious: { label: "의심", color: "#f29900", bg: "rgba(242,153,0,0.08)", icon: "?" },
  normal: { label: "정상", color: "#188038", bg: "rgba(24,128,56,0.08)", icon: "✓" },
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
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
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
    resetAll();
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const analyze = async () => {
    if (tab === "text" && !text.trim()) return;
    if (tab === "image" && !image) return;
    resetAll();
    setAnalyzing(true);

    try {
      let res;
      if (tab === "text") {
        res = await fetch(`${BASE_URL}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text }),
        });
      } else {
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

  const handleHistoryClick = (historyItem) => {
    resetAll();
    setActiveHistory(historyItem.id);
    setSelectedHistoryItem(historyItem);
  };

  const resetAll = () => {
    setResult(null);
    // setText(""); // Do not reset text on history click
    setImage(null);
    setImagePreview(null);
    setActiveHistory(null);
    setSelectedHistoryItem(null);
    setAnalyzing(false);
  };

  const verdict = result ? VERDICT[result.label] ?? VERDICT.normal : null;
  const historyVerdict = selectedHistoryItem ? VERDICT[selectedHistoryItem.label] ?? VERDICT.normal : null;

  return (
    <div style={{
      height: "100vh",
      overflow: "hidden",
      background: "#f8f9fa",
      color: "#212529",
      fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        /* Styles remain unchanged */
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f3f5; }
        ::-webkit-scrollbar-thumb { background: #ced4da; border-radius: 3px; }

        .tab-btn {
          padding: 8px 22px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: #6c757d;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.03em;
        }
        .tab-btn.active {
          background: #ffffff;
          border-color: #dee2e6;
          color: #212529;
          font-weight: 500;
        }
        .tab-btn:hover:not(.active) { color: #495057; }

        .analyze-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
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
          border: 1px solid #e9ecef;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 6px;
        }
        .history-item:hover, .history-item.active {
          border-color: #adb5bd;
          background: #f1f3f5;
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
          border: 2px dashed #ced4da;
          border-radius: 10px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #f1f3f5;
        }
        .drop-zone:hover { border-color: #adb5bd; background: #e9ecef; }

        .scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #0d6efd, transparent);
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
          background-image: linear-gradient(#e9ecef 1px, transparent 1px),
                            linear-gradient(90deg, #e9ecef 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.6;
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
      `}</style>

      <header style={{
        borderBottom: "1px solid #dee2e6",
        padding: "0 32px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "rgba(248,249,250,0.85)",
        backdropFilter: "blur(10px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", color: "#212529" }}>
            피싱 문자 판별
          </span>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{
          width: 220,
          borderRight: "1px solid #dee2e6",
          padding: "24px 16px",
          overflow: "auto",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: "#6c757d", letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", marginBottom: 14, fontWeight: 500 }}>
            최근 분석 이력
          </div>
          {history.length === 0 && (
            <div style={{ fontSize: 11, color: "#adb5bd", textAlign: "center", marginTop: 20 }}>이력 없음</div>
          )}
          {history.map(h => {
            const v = VERDICT[h.label] ?? VERDICT.normal;
            return (
              <div
                key={h.id}
                className={`history-item${activeHistory === h.id ? " active" : ""}`}
                onClick={() => handleHistoryClick(h)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: v.color, opacity: 0.8 }}>
                    {v.label}
                  </span>
                  <span style={{ fontSize: 10, color: "#868e96" }}>{formatTime(h.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#495057", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {h.original_text || `[${h.input_type}]`}
                </div>
              </div>
            );
          })}
        </aside>

        <main style={{ flex: 1, padding: "32px 40px", overflow: "auto", position: "relative" }}>
          <div className="grid-bg" />
          <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            {selectedHistoryItem ? (
              <div className="result-card" style={{animation: 'fadeIn 0.3s ease-out'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                   <h1 style={{ fontSize: 22, fontWeight: 700, color: "#212529", letterSpacing: "-0.01em" }}>
                      분석 이력 상세
                    </h1>
                  <button
                    onClick={() => { setSelectedHistoryItem(null); setActiveHistory(null); }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "1px solid #ced4da",
                      background: "#f8f9fa",
                      color: "#495057",
                      fontSize: 12,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: 'all 0.2s'
                    }}>← 뒤로가기</button>
                </div>

                {/* Verdict header */}
                <div style={{
                  padding: "18px 24px",
                  background: historyVerdict.bg,
                  border: `1px solid ${historyVerdict.color}40`,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 36, height: 36,
                      borderRadius: "50%",
                      background: `${historyVerdict.color}20`,
                      border: `2px solid ${historyVerdict.color}50`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                      color: historyVerdict.color,
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 700,
                    }}>{historyVerdict.icon}</span>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: historyVerdict.color, letterSpacing: "0.02em" }}>
                        {historyVerdict.label}
                      </div>
                      <div style={{ fontSize: 11, color: `${historyVerdict.color}b3`, marginTop: 1 }}>
                        {formatTime(selectedHistoryItem.created_at)} 분석됨
                      </div>
                    </div>
                  </div>
                  {typeof selectedHistoryItem.confidence === 'number' && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: 28,
                        fontWeight: 700,
                        fontFamily: "'Space Mono', monospace",
                        color: historyVerdict.color,
                      }}>{Math.round(selectedHistoryItem.confidence * 100)}<span style={{ fontSize: 14, opacity: 0.6 }}>%</span></div>
                      <div style={{ fontSize: 10, color: `${historyVerdict.color}99`, letterSpacing: "0.1em" }}>CONFIDENCE</div>
                    </div>
                  )}
                </div>

                {/* Original Text */}
                <h2 style={{fontSize: 11, color: "#868e96", letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", marginBottom: 8, marginTop: 24}}>
                  원본 메시지
                </h2>
                <div style={{
                  background: "#ffffff",
                  border: "1px solid #e9ecef",
                  borderRadius: 10,
                  padding: "16px 18px",
                  color: "#495057",
                  fontSize: 14,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 200,
                  overflow: 'auto'
                }}>
                  {selectedHistoryItem.original_text || `[이미지 파일] - 분석 당시 파일명: ${selectedHistoryItem.input_type}`}
                </div>

                {/* Reason */}
                <h2 style={{fontSize: 11, color: "#868e96", letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", marginBottom: 8, marginTop: 24}}>
                  분석 이유
                </h2>
                <div style={{
                  background: "#ffffff",
                  border: "1px solid #e9ecef",
                  borderRadius: 10,
                  padding: "18px 24px",
                }}>
                  {selectedHistoryItem.reason && selectedHistoryItem.reason.length > 0 && selectedHistoryItem.reason[0] !== "특별한 위험 신호 없음" ? (
                    selectedHistoryItem.reason.map((r, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#495057", lineHeight: 1.7, marginBottom: i === selectedHistoryItem.reason.length - 1 ? 0 : 8 }}>• {r}</div>
                    ))
                  ) : (
                    <div style={{ fontSize: 13, color: "#adb5bd" }}>특별한 위험 요소가 탐지되지 않았습니다.</div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#212529", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  메시지 분석
                </h1>
                <p style={{ fontSize: 13, color: "#6c757d", marginBottom: 28, lineHeight: 1.6 }}>
                  의심스러운 문자·메시지를 붙여넣거나 스크린샷을 업로드하세요.
                </p>

                <div style={{ display: "flex", gap: 6, background: "#e9ecef", border: "1px solid #dee2e6", borderRadius: 8, padding: 4, marginBottom: 20, width: "fit-content" }}>
                  <button className={`tab-btn${tab === "text" ? " active" : ""}`} onClick={() => setTab("text")}>
                    ✏ 텍스트 입력
                  </button>
                  <button className={`tab-btn${tab === "image" ? " active" : ""}`} onClick={() => setTab("image")}>
                    🖼 이미지 업로드
                  </button>
                </div>

                {tab === "text" ? (
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="분석할 메시지를 붙여넣으세요..."
                    rows={7}
                    style={{ width: "100%", background: "#ffffff", border: "1px solid #ced4da", borderRadius: 10, padding: "16px 18px", color: "#212529", fontSize: 14, fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical", outline: "none", lineHeight: 1.8, transition: "border-color 0.2s", marginBottom: 16 }}
                    onFocus={e => e.target.style.borderColor = "#86b7fe"}
                    onBlur={e => e.target.style.borderColor = "#ced4da"}
                  />
                ) : (
                  <div className="drop-zone" style={{ marginBottom: 16 }} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={handleImageDrop}>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageDrop} />
                    {imagePreview ? (
                      <div>
                        <img src={imagePreview} alt="preview" style={{ maxHeight: 180, borderRadius: 6, marginBottom: 10 }} />
                        <p style={{ fontSize: 12, color: "#6c757d" }}>{image?.name}</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📷</div>
                        <p style={{ fontSize: 14, color: "#6c757d", marginBottom: 4 }}>이미지를 드래그하거나 클릭하여 업로드</p>
                        <p style={{ fontSize: 12, color: "#adb5bd" }}>PNG, JPG, JPEG 지원</p>
                      </>
                    )}
                  </div>
                )}

                <button className="analyze-btn" onClick={analyze} disabled={analyzing || (tab === "text" ? !text.trim() : !image)}>
                  {analyzing ? "분석 중..." : "분석 시작 →"}
                </button>

                {analyzing && (
                  <div style={{ marginTop: 24, padding: "20px", background: "#f1f3f5", border: "1px solid #e9ecef", borderRadius: 12, textAlign: "center", color: '#495057' }}>
                    AI가 분석하고 있습니다...
                  </div>
                )}

                {result && !analyzing && (
                  <div className="result-card" style={{ marginTop: 24, background: '#ffffff', border: `1px solid #dee2e6`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "18px 24px", background: verdict.bg, borderBottom: `1px solid ${verdict.color}30`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 36, height: 36, borderRadius: "50%", background: `${verdict.color}20`, border: `2px solid ${verdict.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: verdict.color, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                          {verdict.icon}
                        </span>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: verdict.color, letterSpacing: "0.02em" }}>
                            {verdict.label}
                          </div>
                          <div style={{ fontSize: 11, color: `${verdict.color}b3`, marginTop: 1 }}>
                            판정 완료
                          </div>
                        </div>
                      </div>
                      {typeof result.confidence === 'number' && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: verdict.color }}>
                            {Math.round(result.confidence * 100)}<span style={{ fontSize: 14, opacity: 0.6 }}>%</span>
                          </div>
                          <div style={{ fontSize: 10, color: `${verdict.color}99`, letterSpacing: "0.1em" }}>CONFIDENCE</div>
                        </div>
                      )}
                    </div>
                    {typeof result.confidence === 'number' && (
                      <div style={{ padding: "12px 24px 0" }}>
                        <div style={{ height: 4, background: "#e9ecef", borderRadius: 3, overflow: "hidden" }}>
                          <div className="confidence-bar-fill" style={{ width: `${result.confidence * 100}%`, background: verdict.color }} />
                        </div>
                      </div>
                    )}
                    <div style={{ padding: "18px 24px" }}>
                      <div style={{ fontSize: 10, color: "#868e96", letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
                        REASON
                      </div>
                      {result.reason && result.reason.length > 0 ? (
                        result.reason.map((r, i) => (
                          <div key={i} style={{ fontSize: 13, color: "#495057", lineHeight: 1.7 }}>• {r}</div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "#adb5bd" }}>
                          탐지된 이유 없음
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "12px 24px", background: "#f8f9fa", borderTop: "1px solid #e9ecef", display: "flex", gap: 10 }}>
                      <button onClick={() => { setResult(null); setText(""); setImage(null); setImagePreview(null); }} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #ced4da", background: "#ffffff", color: "#6c757d", fontSize: 12, fontFamily: "inherit", cursor: "pointer", marginLeft: "auto" }}>
                        초기화
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
