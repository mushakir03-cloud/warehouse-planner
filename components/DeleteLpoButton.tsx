"use client";

export function DeleteLpoButton({
  action,
  lpoLabel,
}: {
  action: () => Promise<void>;
  lpoLabel: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete ${lpoLabel}? This removes the invoice and its activity history permanently.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
        🗑 Delete Invoice
      </button>
    </form>
  );
}
