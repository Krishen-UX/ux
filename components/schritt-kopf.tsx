import type { ReactNode } from "react";

/**
 * Kurze Einordnung über jedem Screen. Ein Satz, was hier passiert, ein Satz,
 * was man dafür braucht. Mehr Fliesstext soll nicht entstehen.
 */
export function SchrittKopf({
  nummer,
  titel,
  was,
  gebraucht,
  legende,
}: {
  nummer: number;
  titel: string;
  was: ReactNode;
  gebraucht?: ReactNode;
  legende?: boolean;
}) {
  return (
    <header className="nicht-drucken space-y-1 border-b border-border pb-2">
      <div className="flex items-baseline gap-2">
        <span className="ziffern text-[11px] text-muted-foreground">Schritt {nummer} von 3</span>
        <h2 className="text-[13px] font-semibold">{titel}</h2>
      </div>
      <p className="max-w-3xl text-pretty text-muted-foreground">{was}</p>
      {gebraucht ? (
        <p className="max-w-3xl text-[11px] text-pretty text-muted-foreground">{gebraucht}</p>
      ) : null}
      {legende ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-1.5 shrink-0 rounded-full bg-mittel" />
          steht meist nicht im Angebotsschreiben, beim Netzbetreiber erfragen
        </p>
      ) : null}
    </header>
  );
}
