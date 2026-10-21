# Projekt-Skills

Design- und Animations-Skills für Claude Code. Claude Code lädt alles in diesem Ordner automatisch, sobald das Repo geöffnet wird; aufrufen lassen sie sich mit `/<name>` oder indem man die Aufgabe beschreibt.

Die Skills sind unveränderte Kopien der Upstream-Repos (Tests und Evals weggelassen). Ausnahmen stehen in der Spalte „Anpassung“.

| Skill(s) | Quelle | Commit | Anpassung |
| --- | --- | --- | --- |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `3eccfd8` | Skriptpfade auf `.claude/skills/…` statt `${CLAUDE_PLUGIN_ROOT}` |
| `taste-skill` (Name: `design-taste-frontend`) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | `6010f91` | – |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `e3083ac` | ohne Plugin-Hooks; die Engine lädt sich beim ersten Aufruf von `scripts/impeccable` aus den GitHub-Releases (per SHA-256 geprüft) |
| `animate`, `animation-performance`, `animation-vocabulary`, `apple-design`, `ask-sonner`, `break-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `mobile-native`, `pick-ui-library`, `prototype`, `review-animations` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `2d22863` | ohne `write-swift` und `animate-expo` (Swift/React Native) |
| `hallmark` | [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | `13ac0ec` | – |
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, `gsap-frameworks`, `gsap-utils`, `gsap-performance` | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | `aed9cfd` | – |
| `scroll-world` | [oso95/scroll-world](https://github.com/oso95/scroll-world) | `71cc36d` | – |
| `design-md` | [google-labs-code/design.md](https://github.com/google-labs-code/design.md) (`docs/spec.md`) + [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (84 DESIGN.md-Dateien) | `6e5da53` / `3b60532` | eigene `SKILL.md`, die Spezifikation und Bibliothek zusammenführt |

React Bits und Canvas UI sind keine Skills, sondern shadcn-Registries; sie sind in `components.json` eingetragen (`npx shadcn@latest add @react-bits/<Name>` bzw. `@canvas-ui/<Name>`).

Aktualisieren: Upstream-Repo klonen und den jeweiligen Skill-Ordner über den alten kopieren, danach die Anpassungen aus der Tabelle erneut anwenden und den Commit hier nachtragen.
