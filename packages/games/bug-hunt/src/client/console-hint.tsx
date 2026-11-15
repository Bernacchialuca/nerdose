export type HintAnnouncement = { id: number; text: string };

/** Visible console line (silent) plus a polite region that gets one node per announcement. */
export function ConsoleHint({
  text,
  announcement,
}: {
  text: string;
  announcement: HintAnnouncement | null;
}) {
  return (
    <>
      <p className="min-h-5 font-mono text-label-comment text-text-dim">{text}</p>
      <div aria-live="polite" className="sr-only">
        {announcement ? <p key={announcement.id}>{announcement.text}</p> : null}
      </div>
    </>
  );
}
