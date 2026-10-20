import type { ReactNode } from "react";
import { Hinweis } from "./felder";
import { cn } from "@/lib/utils";

/**
 * Carbon-Kachel auf Layer 01. Felder darin liegen eine Ebene höher und werden weiss.
 */
export function Karte({
  children,
  className,
  titel,
  aktion,
  hinweis,
}: {
  children: ReactNode;
  className?: string;
  titel?: string;
  aktion?: ReactNode;
  hinweis?: string;
}) {
  return (
    <section className={cn("bg-card p-4 [--field:#ffffff]", className)}>
      {titel ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-base font-semibold">
            {titel}
            {hinweis ? <Hinweis text={hinweis} /> : null}
          </h3>
          {aktion}
        </div>
      ) : null}
      {children}
    </section>
  );
}
