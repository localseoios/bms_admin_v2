import React, { useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  CursorArrowRaysIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PDFSignatureViewer({
  pdfUrl,
  signatureImageUrl,
  onSignaturePositionSelect,
  onCancel,
  signerName,
}) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [signaturePositions, setSignaturePositions] = useState([]);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [justDragged, setJustDragged] = useState(false);
  const containerRef = useRef(null);
  const pageRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error("Error loading PDF:", error);
    setError("Failed to load PDF document");
    setIsLoading(false);
  };

  const onPageLoadSuccess = (page) => {
    setPdfDimensions({
      width: page.width,
      height: page.height,
    });
  };

  const handlePageClick = useCallback(
    (e) => {
      // Don't create new signature if we're dragging or just finished dragging
      if (!pageRef.current || draggingId || justDragged) return;

      const rect = pageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const signatureWidth = 150;
      const signatureHeight = 50;

      const newPosition = {
        id: Date.now(),
        x: x - signatureWidth / 2,
        y: y - signatureHeight / 2,
        width: signatureWidth,
        height: signatureHeight,
        page: currentPage,
        pdfWidth: pdfDimensions.width / scale,
        pdfHeight: pdfDimensions.height / scale,
      };

      setSignaturePositions((prev) => [...prev, newPosition]);
    },
    [scale, currentPage, pdfDimensions, draggingId, justDragged]
  );

  const handleDragStart = useCallback((e, pos) => {
    e.stopPropagation();
    const rect = pageRef.current.getBoundingClientRect();
    setDraggingId(pos.id);
    setDragOffset({
      x: e.clientX - rect.left - pos.x * scale,
      y: e.clientY - rect.top - pos.y * scale,
    });
  }, [scale]);

  const handleDragMove = useCallback((e) => {
    if (!draggingId || !pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const newX = (e.clientX - rect.left - dragOffset.x) / scale;
    const newY = (e.clientY - rect.top - dragOffset.y) / scale;

    setSignaturePositions((prev) =>
      prev.map((pos) =>
        pos.id === draggingId
          ? { ...pos, x: newX, y: newY }
          : pos
      )
    );
  }, [draggingId, dragOffset, scale]);

  const handleDragEnd = useCallback(() => {
    if (draggingId) {
      setJustDragged(true);
      // Reset justDragged after a short delay to allow click event to be ignored
      setTimeout(() => setJustDragged(false), 100);
    }
    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggingId]);

  const handleConfirmPositions = () => {
    if (signaturePositions.length > 0 && onSignaturePositionSelect) {
      onSignaturePositionSelect(signaturePositions);
    }
  };

  const handleRemovePosition = (id) => {
    setSignaturePositions((prev) => prev.filter((pos) => pos.id !== id));
  };

  const handleClearAllPositions = () => {
    setSignaturePositions([]);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const currentPagePositions = signaturePositions.filter(
    (pos) => pos.page === currentPage
  );

  const positionsByPage = signaturePositions.reduce((acc, pos) => {
    acc[pos.page] = (acc[pos.page] || 0) + 1;
    return acc;
  }, {});

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CursorArrowRaysIcon className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Click to add signatures • Drag to move • Hover to delete
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-200 rounded-full"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5 text-white" />
          </button>
          <span className="text-white text-sm">
            Page {currentPage} of {numPages || "..."}
            {positionsByPage[currentPage] && (
              <span className="ml-2 px-2 py-0.5 bg-green-500 rounded-full text-xs">
                {positionsByPage[currentPage]} signature(s)
              </span>
            )}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= (numPages || 1)}
            className="p-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            <MagnifyingGlassMinusIcon className="h-5 w-5 text-white" />
          </button>
          <span className="text-white text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="p-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            <MagnifyingGlassPlusIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-500 p-4 flex justify-center"
      >
        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        <div
          ref={pageRef}
          className="relative cursor-crosshair shadow-2xl"
          onClick={handlePageClick}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={{ display: isLoading ? "none" : "block" }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          {currentPagePositions.map((pos, index) => (
            <div
              key={pos.id}
              className={`absolute border-2 border-dashed bg-blue-100 bg-opacity-30 group select-none ${
                draggingId === pos.id
                  ? "border-green-500 cursor-grabbing z-50"
                  : "border-blue-500 cursor-grab"
              }`}
              style={{
                left: pos.x * scale,
                top: pos.y * scale,
                width: pos.width * scale,
                height: pos.height * scale,
              }}
              onMouseDown={(e) => handleDragStart(e, pos)}
            >
              {signatureImageUrl ? (
                <img
                  src={signatureImageUrl}
                  alt="Signature Preview"
                  className="w-full h-full object-contain opacity-70 pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-blue-600 font-medium">
                    {signerName || "Signature"} #{index + 1}
                  </span>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePosition(pos.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Drag to move
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 px-4 py-3 border-t flex items-center justify-between">
        <div>
          {signaturePositions.length > 0 ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-green-600 font-medium">
                ✓ {signaturePositions.length} signature position(s) selected
                {Object.keys(positionsByPage).length > 1 && (
                  <span className="text-gray-500 ml-1">
                    (across {Object.keys(positionsByPage).length} pages)
                  </span>
                )}
              </span>
              <button
                onClick={handleClearAllPositions}
                className="text-sm text-red-600 hover:text-red-700 underline flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-500">
              Click anywhere on the document to add signature positions
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPositions}
            disabled={signaturePositions.length === 0}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm & Sign ({signaturePositions.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export default PDFSignatureViewer;
