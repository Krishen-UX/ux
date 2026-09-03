import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Schlichter Rahmen für Inhaltsblöcke, bewusst ohne Schatten und Rundungen. */
export function Karte({
  children,
  className,
  titel,
  aktion,
}: {
  children: ReactNode;
  className?: string;
  titel?: string;
  aktion?: ReactNode;
}) {
  return (
    <section className={cn("rounded-md border border-border bg-card p-3", className)}>
      {titel ? (
        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-border pb-1">
          <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {titel}
          </h3>
          {aktion}
        </div>
      ) : null}
      {children}
    </section>
  );
}
