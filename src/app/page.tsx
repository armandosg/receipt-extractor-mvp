/**
 * @module Home
 * @description Main page composing ReceiptUploader, ReceiptResult, CopyButton,
 * and ErrorMessage to form the receipt extraction flow.
 */

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ProcessReceiptResult } from "@/actions/processReceipt";
import ReceiptUploader from "@/components/ReceiptUploader";
import ReceiptResult from "@/components/ReceiptResult";
import CopyButton from "@/components/CopyButton";
import ErrorMessage from "@/components/ErrorMessage";

/**
 * Home page for the receipt data extractor.
 *
 * Manages processing state and displays results or errors after the
 * server action resolves.
 * @returns The main application page.
 */
export default function Home() {
  const [result, setResult] = useState<ProcessReceiptResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <main className="w-full max-w-xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Receipt Extractor
          </h1>
          <p className="mt-2 text-gray-600">
            Upload a receipt photo or PDF to extract structured data for your
            spreadsheet.
          </p>
        </header>

        <ReceiptUploader
          onResult={setResult}
          onProcessingChange={setIsProcessing}
        />

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing receipt…
          </div>
        )}

        {result?.success && (
          <div className="space-y-4">
            <ReceiptResult data={result.data} />
            <div className="flex justify-end">
              <CopyButton data={result.data} />
            </div>
          </div>
        )}

        {result && !result.success && (
          <ErrorMessage message={result.error} />
        )}
      </main>
    </div>
  );
}
