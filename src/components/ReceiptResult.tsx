/**
 * @module ReceiptResult
 * @description Displays extracted receipt data in a clean card layout
 * with labeled fields for each piece of extracted information.
 */

import type { Receipt } from "@/lib/schemas/receipt";

/** Label-value field configuration for display. */
interface FieldConfig {
  /** Human-readable label for the field. */
  label: string;
  /** The value to display. */
  value: string | number;
}

/**
 * Props for the {@link ReceiptResult} component.
 */
interface ReceiptResultProps {
  /** The extracted receipt data to display. */
  readonly data: Receipt;
}

/**
 * Renders extracted receipt data as a card with labeled fields.
 * @param props - Component props.
 * @param props.data - The extracted receipt data to display.
 * @returns A card displaying each receipt field with its label and value.
 */
export default function ReceiptResult({ data }: ReceiptResultProps) {
  const fields: FieldConfig[] = [
    { label: "Date", value: data.date },
    { label: "Merchant", value: data.merchant },
    { label: "Total", value: data.totalAmount },
    { label: "Currency", value: data.currency },
    { label: "Expense Type", value: data.expenseType },
    { label: "Payment Method", value: data.paymentMethod },
  ];

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Extracted Receipt Data
        </h2>
      </div>
      <dl className="divide-y divide-gray-100">
        {fields.map((field) => (
          <div
            key={field.label}
            className="grid grid-cols-3 gap-4 px-4 py-3"
          >
            <dt className="text-sm font-medium text-gray-500">
              {field.label}
            </dt>
            <dd className="col-span-2 text-sm text-gray-900">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
