import type { AnlagenTyp, Alternative, Annahmen, FcaAngebot, Projekt } from "@/lib/typen";
import {
  ALTERNATIVE_VORLAGE,
  ANGEBOT_VORLAGE,
  ANNAHMEN_VORLAGE,
  PROJEKT_VORLAGE,
} from "@/data/annahmen";

/** Bausteine für Tests und für den Startzustand der Oberfläche. */
export function vorlage(typ: AnlagenTyp): {
  projekt: Projekt;
  angebot: FcaAngebot;
  annahmen: Annahmen;
  alternative: Alternative;
} {
  return {
    projekt: { id: typ, ...structuredClone(PROJEKT_VORLAGE[typ]) },
    angebot: structuredClone(ANGEBOT_VORLAGE[typ]),
    annahmen: structuredClone(ANNAHMEN_VORLAGE[typ]),
    alternative: structuredClone(ALTERNATIVE_VORLAGE[typ]),
  };
}
