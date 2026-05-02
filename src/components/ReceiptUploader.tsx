"use client";

/**
 * @module ReceiptUploader
 * @description Client component providing drag-and-drop and click-to-upload
 * functionality for receipt images and PDFs. Validates file size, compresses
 * images client-side, and shows a preview before submission.
 */

import { useState, useRef, useCallback, useEffect, type ChangeEvent } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import log from "@/lib/logger";
import { processReceipt, type ProcessReceiptResult } from "@/actions/processReceipt";

/** Maximum allowed file size in bytes (10 MB). */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** MIME types accepted by the uploader. */
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/** Props for {@link ReceiptUploader}. */
interface ReceiptUploaderProps {
  /**
   * Callback fired when the server action resolves.
   * @param result - The result from the processReceipt server action.
   */
  readonly onResult: (result: ProcessReceiptResult) => void;
  /**
   * Callback fired when processing starts or ends.
   * @param processing - `true` when a receipt is being processed.
   */
  readonly onProcessingChange: (processing: boolean) => void;
  /**
   * A file received externally (e.g. via the Web Share Target API).
   * When set, the uploader loads and previews it automatically.
   */
  readonly initialFile?: File | null;
}

/**
 * Validate that a file meets the type and size requirements.
 * @param file - The file to validate.
 * @returns An error message string if invalid, or `null` if valid.
 */
function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) {
    log.warn(`Rejected file with unsupported type: ${file.type} (${file.name})`);
    return `Unsupported file type "${file.type}". Please upload a JPEG, PNG, WebP image, or a PDF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    log.warn(`Rejected file exceeding size limit: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`;
  }
  return null;
}

/**
 * Compress an image file using browser-image-compression.
 * PDFs are returned as-is since they cannot be compressed client-side.
 * @param file - The file to potentially compress.
 * @returns The original file (if PDF) or a compressed image file.
 */
async function compressIfImage(file: File): Promise<File> {
  if (file.type === "application/pdf") {
    return file;
  }

  log.debug(`Compressing image: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);

  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
  });

  log.debug(
    `Compression complete: ${(file.size / 1024).toFixed(0)} KB → ${(compressed.size / 1024).toFixed(0)} KB`,
  );

  return compressed;
}

/**
 * Receipt file uploader with drag-and-drop support, image compression,
 * preview display, and server action integration.
 * @param props - Component props.
 * @param props.onResult - Callback receiving the server action result.
 * @param props.onProcessingChange - Callback receiving processing state changes.
 * @param props.initialFile - An optional file to load on mount (e.g. from Web Share Target).
 * @returns The rendered uploader component.
 */
export default function ReceiptUploader({ onResult, onProcessingChange, initialFile }: ReceiptUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Clean up the current object URL preview to avoid memory leaks.
   */
  const revokePreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  }, [preview]);

  /**
   * Handle a selected or dropped file: validate, compress, and set preview.
   * @param selectedFile - The file chosen by the user.
   */
  const handleFile = useCallback(
    async (selectedFile: File) => {
      setError(null);

      log.debug(
        `File selected — name: ${selectedFile.name}, type: ${selectedFile.type}, size: ${selectedFile.size} bytes`,
      );

      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      const processed = await compressIfImage(selectedFile);

      revokePreview();

      if (processed.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(processed));
      } else {
        setPreview(null);
      }

      setFile(processed);
    },
    [revokePreview],
  );

  // Load a file supplied externally (e.g. from Web Share Target)
  useEffect(() => {
    if (initialFile) {
      handleFile(initialFile);
    }
  }, [initialFile]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle file input change event.
   * @param e - The input change event.
   */
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        handleFile(selected);
      }
    },
    [handleFile],
  );

  /**
   * Handle dragover to allow drop and provide visual feedback.
   * @param e - The drag event.
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * Handle dragleave to reset visual feedback.
   * @param e - The drag event.
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * Handle file drop.
   * @param e - The drop event.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile],
  );

  /**
   * Open the native file picker dialog.
   */
  const handleZoneClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /**
   * Clear the currently selected file and reset state.
   */
  const handleClear = useCallback(() => {
    revokePreview();
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [revokePreview]);

  /**
   * Submit the selected file to the processReceipt server action.
   */
  const handleSubmit = useCallback(async () => {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    onProcessingChange(true);

    try {
      const formData = new FormData();
      formData.append("receipt", file);
      const result = await processReceipt(formData);
      onResult(result);
    } finally {
      setIsProcessing(false);
      onProcessingChange(false);
    }
  }, [file, isProcessing, onResult, onProcessingChange]);

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <button
        type="button"
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          data-testid="file-input"
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            {preview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-48 rounded-md object-contain"
              />
            ) : (
              <FileText className="h-16 w-16 text-gray-400" />
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="max-w-[200px] truncate">{file.name}</span>
              <span>({(file.size / 1024).toFixed(0)} KB)</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Upload className="h-10 w-10" />
            <p className="text-sm font-medium">
              Drag & drop your receipt here, or click to browse
            </p>
            <p className="text-xs text-gray-400">
              JPEG, PNG, WebP, or PDF — up to 10 MB
            </p>
          </div>
        )}
      </button>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || isProcessing}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Process Receipt
          </>
        )}
      </button>
    </div>
  );
}
