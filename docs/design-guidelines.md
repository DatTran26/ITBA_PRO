# Design guidelines

Visual language for the product UI in `Frontend/`. Token values and components
in source remain the executable owners.

**Owning document:** [`downtown/design-guidelines.md`](downtown/design-guidelines.md).

Runtime tokens: `Frontend/src/app/globals.css`.
Shared primitives: `Frontend/src/components/ui/`.
Root layout locale: Vietnamese (`lang="vi"`).

## Decisions source cannot state

- Direction is **Deep Intelligence**: dark-first, Arctic Minimalist. Navy
  surfaces, indigo as the primary interactive color, status colors only for
  meaning.
- Dark theme is the supported product theme. Light tokens in `:root` are not a
  supported surface until a separate decision and tests exist.
- Glass, gradient, and glow add depth; they must not compete with data.
- When promoting a slice from `modules/` into the product, keep verified
  behavior and rebuild presentation with Town Hown tokens. Module CSS is not a
  template.

Handoff and accessibility criteria stay in the downtown file. Figma-oriented
spec (stateful design record): [`downtown/design-system-figma-spec.md`](downtown/design-system-figma-spec.md).
