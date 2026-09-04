import type { ReactNode } from "react";
import { Hinweis } from "./felder";
import { cn } from "@/lib/utils";

/** Schlichter Rahmen für Inhaltsblöcke, bewusst ohne Schatten und Rundungen. */
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
    <section className={cn("rounded-md border border-border bg-card p-3", className)}>
      {titel ? (
        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-border pb-1">
          <h3 className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
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
