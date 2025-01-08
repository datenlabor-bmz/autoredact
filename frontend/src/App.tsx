import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
} from "react-pdf-highlighter";
import type {
  Content,
  IHighlight,
  NewHighlight,
  ScaledPosition,
} from "react-pdf-highlighter";

import { Sidebar } from "./Sidebar";
import { Spinner } from "./Spinner";

import "./style/App.css";
import "../node_modules/react-pdf-highlighter/dist/style.css";

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

export function App() {
  const [url, setUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [currentPdfFile, setCurrentPdfFile] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>(
    `Redact all personal information, confidential data, and sensitive business information.`
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const resetHighlights = () => {
    setHighlights([]);
  };

  const toggleDocument = () => {
    if (uploadedPdfUrl) {
      setUrl(uploadedPdfUrl);
    } else {
      setHighlights([]);
    }
  };

  const scrollViewerTo = useRef<(highlight: IHighlight) => void>(() => {});

  const scrollToHighlightFromHash = useCallback(() => {
    const highlightId = parseIdFromHash();
    if (!highlightId) return;
    
    const highlight = highlights.find(h => h.id === highlightId);
    if (highlight) {
      // Add a small delay to ensure the PDF is ready
      setTimeout(() => {
        scrollViewerTo.current(highlight);
      }, 100);
    }
  }, [highlights]);

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToHighlightFromHash,
        false,
      );
    };
  }, [scrollToHighlightFromHash]);

  const getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  const addHighlight = (highlight: NewHighlight) => {
    // PDF standard dimensions (A4)
    const PDF_WIDTH = 595.32;
    const PDF_HEIGHT = 841.92;
    
    // Get current viewport dimensions
    const { width: viewportWidth, height: viewportHeight } = highlight.position.boundingRect;
    
    // Calculate scale factors
    const scaleX = PDF_WIDTH / viewportWidth;
    const scaleY = PDF_HEIGHT / viewportHeight;
    
    // Convert coordinates
    const enrichedHighlight = {
      ...highlight,
      position: {
        ...highlight.position,
        boundingRect: {
          ...highlight.position.boundingRect,
          x1: highlight.position.boundingRect.x1 * scaleX,
          y1: highlight.position.boundingRect.y1 * scaleY,
          x2: highlight.position.boundingRect.x2 * scaleX,
          y2: highlight.position.boundingRect.y2 * scaleY,
          width: PDF_WIDTH,
          height: PDF_HEIGHT,
        },
        rects: highlight.position.rects.map(rect => ({
          ...rect,
          x1: rect.x1 * scaleX,
          y1: rect.y1 * scaleY,
          x2: rect.x2 * scaleX,
          y2: rect.y2 * scaleY,
          width: PDF_WIDTH,
          height: PDF_HEIGHT,
        }))
      },
      id: getNextId()
    };

    setHighlights(prevHighlights => [enrichedHighlight, ...prevHighlights]);
  };

  const updateHighlight = (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>,
  ) => {
    setHighlights((prevHighlights) =>
      prevHighlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      }),
    );
  };

  const handleFileUpload = (fileUrl: string, file: File) => {
    setUploadedPdfUrl(fileUrl);
    setUrl(fileUrl);
    setHighlights([]);
    setCurrentPdfFile(file);
  };

  // Clean up object URLs when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (uploadedPdfUrl) {
        URL.revokeObjectURL(uploadedPdfUrl);
      }
    };
  }, [uploadedPdfUrl]);

  const deleteHighlight = useCallback((id: string) => {
    setHighlights(prevHighlights => prevHighlights.filter(hl => hl.id !== id));
  }, []);

  const handleBackendHighlights = useCallback((newHighlights: Array<IHighlight>) => {
    setHighlights(prevHighlights => [...prevHighlights, ...newHighlights]);
  }, []);

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff3cd",
          color: "#856404",
          padding: "12px",
          textAlign: "center",
          zIndex: 1000,
          borderBottom: "1px solid #ffeeba",
          fontSize: "14px"
        }}
      >
        <span role="img" aria-label="warning">⚠️</span>
        <strong>DISCLAIMER</strong>: This software is currently in development and not yet ready for production use. 
        Use at your own risk and always verify redactions manually.
      </div>
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
        onFileUpload={handleFileUpload}
        onDeleteHighlight={deleteHighlight}
        onBackendHighlights={handleBackendHighlights}
        currentPdfFile={currentPdfFile}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
        isAnalyzing={isAnalyzing}
        setIsAnalyzing={setIsAnalyzing}
        setHighlights={setHighlights}
      />
      <div
        className="pdf-viewer"
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative",
        }}
      >
        {url ? (
          <PdfLoader url={url} beforeLoad={<Spinner />}>
            {(pdfDocument) => {
              return (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  pdfScaleValue="page-width"
                  enableAreaSelection={(event) => event.altKey}
                  onScrollChange={resetHash}
                  scrollRef={(scrollTo) => {
                    scrollViewerTo.current = scrollTo;
                    // Only call scroll if there's a hash present
                    if (document.location.hash) {
                      scrollToHighlightFromHash();
                    }
                  }}
                  onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => {
                    addHighlight({
                      content,
                      position,
                      comment: { text: "", emoji: "" }
                    });
                    return null;
                  }}
                  highlightTransform={(
                    highlight,
                    index,
                    setTip,
                    hideTip,
                    viewportToScaled,
                    screenshot,
                    isScrolledTo,
                  ) => {
                    const isTextHighlight = !highlight.content?.image;

                    return isTextHighlight ? (
                      <div onClick={() => deleteHighlight(highlight.id)}>
                        <Highlight
                          isScrolledTo={isScrolledTo}
                          position={highlight.position}
                          comment={highlight.comment}
                        />
                      </div>
                    ) : (
                      <div onClick={() => deleteHighlight(highlight.id)}>
                        <AreaHighlight
                          isScrolledTo={isScrolledTo}
                          highlight={highlight}
                          onChange={(boundingRect) => {
                            updateHighlight(
                              highlight.id,
                              { boundingRect: viewportToScaled(boundingRect) },
                              { image: screenshot(boundingRect) },
                            );
                          }}
                        />
                      </div>
                    );
                  }}
                  highlights={highlights}
                />
              );
            }}
          </PdfLoader>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}