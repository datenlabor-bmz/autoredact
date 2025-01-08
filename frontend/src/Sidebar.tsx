import type { IHighlight } from "react-pdf-highlighter";
import React, { useEffect } from "react";
import { FileUpload } from "./components/FileUpload";
import { RedactionHints } from "./components/RedactionHints";
import { SidebarFooter } from "./components/SidebarFooter";
import { PromptInput } from "./components/PromptInput";
import { downloadPdf } from "./actions/download";
import { uploadPdf } from "./actions/upload";
import { analyzePdf } from "./actions/analyze";

interface Props {
  highlights: Array<IHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  onFileUpload: (fileUrl: string, file: File) => void;
  onDeleteHighlight?: (id: string) => void;
  onBackendHighlights: (highlights: Array<IHighlight>) => void;
  currentPdfFile: File | null;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setHighlights: (highlights: Array<IHighlight>) => void;
}

const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

export function Sidebar({
  highlights,
  resetHighlights,
  onFileUpload,
  onDeleteHighlight,
  onBackendHighlights,
  currentPdfFile,
  customPrompt,
  setCustomPrompt,
  isAnalyzing,
  setIsAnalyzing,
  setHighlights,
}: Props) {
  

  const sortedHighlights = [...highlights].sort((a, b) => {
    // First sort by page number
    if (a.position.pageNumber !== b.position.pageNumber) {
      return a.position.pageNumber - b.position.pageNumber;
    }

    // If on same page, sort by vertical position (top to bottom)
    return a.position.boundingRect.y1 - b.position.boundingRect.y1;
  });

  return (
        <div
      className="sidebar"
          style={{
        width: "20%",
        minWidth: "250px",
        padding: "2rem",
            display: "flex",
        flexDirection: "column",
        gap: "2rem",
        backgroundColor: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
          }}
        >
      {/* Header */}
      <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1.5rem" }}>
        <div style={{
              display: "flex",
              alignItems: "center",
          gap: "0.5rem",
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#1e293b",
        }}>
          <span>⬛️</span>
          <span style={{ color: "#0f172a" }}>AutoRedact</span>
        </div>
        <div style={{
              fontSize: "0.9rem",
          color: "#3b82f6",
          marginTop: "0.5rem",
        }}>
          AI-assisted document redaction
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <FileUpload
          onFileUpload={async (event: React.ChangeEvent<HTMLInputElement>) => uploadPdf(event, onFileUpload, onBackendHighlights)}
          currentFileName={currentPdfFile?.name}
        />

        {currentPdfFile && (
          <>
          <PromptInput
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            onAnalyzePdf={async () => analyzePdf(currentPdfFile, customPrompt, setHighlights, setIsAnalyzing)}
            isAnalyzing={isAnalyzing}
          />

          <RedactionHints />
          </>
        )}

        {highlights.length > 0 && (
          <>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>
                Redactions
              </div>
          <button
            onClick={resetHighlights}
            style={{
                  background: "none",
                  border: "none",
                  padding: "0.4rem 0.6rem",
                  fontSize: "0.75rem",
                  color: "#64748b",
                  cursor: "pointer",
                  borderRadius: "4px",
            }}
          >
                🗑️ Reset all
          </button>
            </div>

            {currentPdfFile && (
          <button
            onClick={async () => downloadPdf(currentPdfFile, highlights)}
            style={{
              width: "100%",
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: "#1e293b",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
            }}
          >
            Save Redacted PDF
          </button>
        )}

            <ul className="sidebar__highlights" style={{
              backgroundColor: "#ffffff",
              padding: "1rem",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}>
              {sortedHighlights.map((highlight) => (
                <li
                  key={highlight.id}
                  className="sidebar__highlight"
                style={{
                    padding: "0.75rem",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "6px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "8px",
                  }}>
                <div
                  style={{ flex: 1, cursor: "pointer" }}
                      onClick={() => updateHash(highlight)}
                >
                      <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "8px",
                      }}>
                        {highlight.content.text && (
                          <blockquote style={{
                            flex: 1,
                            margin: 0,
                            fontSize: "0.85rem",
                            lineHeight: "1.4",
                            color: "#334155",
                          }}>
                        {highlight.content.text.length > 60
                          ? `${highlight.content.text.slice(0, 60).trim()}…`
                          : highlight.content.text.trim()}
                      </blockquote>
                        )}
                        <div style={{
                          whiteSpace: "nowrap",
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: "500",
                        }}>
                      Page {highlight.position.pageNumber}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteHighlight?.(highlight.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                        fontSize: "1.1rem",
                    padding: "0 4px",
                        color: "#94a3b8",
                    lineHeight: 1,
                  }}
                  title="Remove redaction"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
          </>
        )}
        </div>

      <SidebarFooter />
    </div>
  );
}
