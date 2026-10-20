import type { ReactNode } from "react";
import { WarningAltFilled } from "@carbon/icons-react";

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
    <header className="nicht-drucken pb-2">
      <p className="ziffern text-xs text-muted-foreground">Schritt {nummer} von 4</p>
      <h2 className="mt-1 text-2xl font-normal">{titel}</h2>
      <p className="mt-3 max-w-3xl text-base leading-6 text-pretty text-foreground">{was}</p>
      {gebraucht ? (
        <p className="mt-2 max-w-3xl text-sm text-pretty text-muted-foreground">{gebraucht}</p>
      ) : null}
      {legende ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <WarningAltFilled className="size-4 shrink-0 text-mittel" />
          steht meist nicht im Angebotsschreiben, beim Netzbetreiber erfragen
        </p>
      ) : null}
    </header>
  );
}
