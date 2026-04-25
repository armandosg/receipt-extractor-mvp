/**
 * @module CopyButton
 * @description A button that copies extracted receipt data to the clipboard
 * as a tab-separated string, with brief visual feedback on success.
 */

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Receipt } from "@/lib/schemas/receipt";
import { formatReceiptToTsv } from "@/lib/utils/formatTsv";

/**
 * Props for the {@link CopyButton} component.
 */
interface CopyButtonProps {
  /** The extracted receipt data to copy as TSV. */
  readonly data: Receipt;
}

/**
 * Copies receipt data to the clipboard as a TSV string.
 *
 * Shows a checkmark icon for ~2 seconds after a successful copy,
 * then reverts to the default copy icon.
 * @param props - Component props.
 * @param props.data - The receipt data to format and copy.
 * @returns A button that copies TSV to the clipboard on click.
 */
export default function CopyButton({ data }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Handles the copy action: formats the receipt as TSV,
   * writes it to the clipboard, and triggers visual feedback.
   */
  async function handleCopy() {
    const tsv = formatReceiptToTsv(data);
    await navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy as TSV
        </>
      )}
    </button>
  );
}
