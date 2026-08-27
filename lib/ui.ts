/**
 * Shared style vocabulary. Buttons, cards and fields were previously styled
 * by hand at ~15 call sites, which is why radii and padding drifted between
 * screens. Import these instead of writing new one-off class strings.
 *
 * Deliberately plain strings rather than wrapper components: the call sites
 * are a mix of <button>, <Link> and form-action buttons across both server
 * and client components, and strings work uniformly for all of them.
 */

/** Filled accent button — the single primary action on a screen. */
export const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40";

/** Confirming something consequential (delivery complete). */
export const btnConfirm =
  "inline-flex items-center justify-center rounded-full bg-green-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-40";

/** Neutral secondary action sitting next to a primary one. */
export const btnSecondary =
  "inline-flex items-center justify-center rounded-full border border-hairline bg-white px-5 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50";

/** Destructive action — quiet until hovered, so it isn't a target for stray taps. */
export const btnDanger =
  "inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50";

/** Small pill used for inline links that read as buttons. */
export const btnSmall =
  "inline-flex items-center justify-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20";

/** Panel surface: hairline border, soft radius, barely-there lift. */
export const card =
  "rounded-2xl border border-hairline/60 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

/** Text input / select / textarea. */
export const field =
  "w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-accent focus:outline-none";

/** Field label. */
export const fieldLabel = "mb-1.5 block text-sm font-medium text-gray-700";
