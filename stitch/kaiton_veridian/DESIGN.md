```markdown
# Design System Document: High-End Editorial Performance

## 1. Overview & Creative North Star: "The Obsidian Pulse"

This design system is built to transform complex athletic data into a premium, editorial experience. We are moving away from the "utility-first" look of typical fitness trackers toward a **"High-End Editorial"** aesthetic. 

The Creative North Star is **The Obsidian Pulse**. Imagine a high-end luxury watch face or a dark-mode editorial spread: it is deep, immersive, and uses light as a surgical tool rather than a floodlight. We achieve this through "Atmospheric Depth"—layering dark greens to create a sense of infinite space, punctuated by high-precision emerald accents that feel like glowing instrumentation.

### Breaking the Template
*   **Intentional Asymmetry:** Avoid perfectly centered grids. Align data visualizations to the right or left to create a "scanning path" that feels modern and dynamic.
*   **Overlapping Elements:** Let high-performance metrics (e.g., "Ritmo Actual") slightly overlap background containers to create a sense of momentum.
*   **Data as Art:** Typography is not just for reading; it is a graphical element. Large, bold numbers are treated with the same reverence as photography.

---

## 2. Colors: Tonal Atmosphere

Our palette is inspired by nocturnal forest runs—deep, quiet, and focused. We rely on the Material Design 3 logic of "On-Surface" roles but apply them with an editorial eye.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Boundaries must be defined solely through background shifts. Use `surface_container_low` against `surface` to create a section. Lines represent "closed" thinking; tonal shifts represent "flow."

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of tinted glass:
*   **Base Layer:** `surface` (#04170c) for the global background.
*   **Section Layer:** `surface_container` (#102418) for large content areas.
*   **Component Layer:** `surface_container_high` (#1a2e22) for interactive cards.
*   **Active Layer:** `surface_bright` (#293e31) for elements demanding immediate focus.

### The Glass & Gradient Rule
To prevent the UI from feeling "flat," use `glassmorphism` for floating headers or navigation bars.
*   **Token:** `surface_container_low` at 70% opacity + 20px backdrop-blur.
*   **Signature Gradients:** Use a subtle linear gradient for primary CTAs: `primary` (#5af0b3) to `primary_container` (#34d399) at a 135-degree angle. This adds "soul" and a tactile, liquid feel to the buttons.

---

## 3. Typography: The Language of Precision

We use a dual-typeface system to balance high-tech data with editorial elegance.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` and `headline-lg` in Bold or Extra-Bold for "Kilómetros" or "Tiempo Total." This creates a "command center" feel.
*   **Body & Labels (Inter):** Chosen for its world-class legibility at small sizes. Used for "Sugerencia del Entrenador" or "Ritmo Cardiaco."
*   **Tone:** Large typography should be used aggressively. If a runner hits a PR, the number should be the hero—let it breathe with generous `headline-lg` sizing.

---

## 4. Elevation & Depth: Tonal Layering

We reject the standard "Drop Shadow." Instead, we use **Tonal Layering** to communicate hierarchy.

*   **The Layering Principle:** Place a `surface_container_lowest` (#011208) card on a `surface_container_low` (#0b1f14) section. This "recessed" look feels more sophisticated than a "lifted" look.
*   **Ambient Shadows:** If an element must float (e.g., a "Start Run" FAB), use a shadow tinted with `surface_tint` (#45dfa4) at 5% opacity with a 32px blur. It should look like a soft glow, not a dark smudge.
*   **The Ghost Border Fallback:** For accessibility in input fields, use `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components: Elite Instrumentation

### Buttons (Botones)
*   **Primary:** Gradient (`primary` to `primary_container`), `on_primary` text, Bold. Radius: `full`.
*   **Secondary:** `surface_container_highest` background, `primary` text. Radius: `md`.
*   **Interaction:** On press, scale down to 96% to simulate a physical "click."

### Performance Cards (Tarjetas de Rendimiento)
*   **Constraint:** Forbid divider lines.
*   **Structure:** Use `surface_container_high` as the base. Use `title-md` for the metric name (e.g., "Cadencia") and `display-sm` for the value.
*   **Separation:** Use `xl` spacing (1.5rem) to separate cards rather than a line.

### Data Inputs (Entradas de Datos)
*   **Style:** Minimalist. `surface_container_lowest` background with a `sm` radius. 
*   **State:** On focus, the `outline` becomes `primary` but at only 40% opacity.

### Specialized Component: The "Pulse Monitor"
A custom data visualization component. Use a `secondary_container` background with a semi-transparent `primary` sparkline. This provides a "tech-forward" AI aesthetic that feels bespoke to the app's mission.

---

## 6. Do's and Don'ts

### Do
*   **DO:** Use Spanish (ES) terminology that feels professional: "Entrenamiento" instead of "Workout," "Ritmo" instead of "Pace."
*   **DO:** Leverage the `tertiary` (#ffccad) color for recovery or "rest" states to provide a warm, human contrast to the technical greens.
*   **DO:** Use `label-sm` in `on_surface_variant` for metadata to ensure the primary metrics pop.

### Don't
*   **DON'T:** Use pure white (#FFFFFF). Only use `on_background` (#d0e8d6) or `text-primary` (#f0fdf4). Pure white "vibrates" too harshly on dark green backgrounds.
*   **DON'T:** Use standard 8px grids for everything. Use "Breathing Room"—increase vertical spacing to 32px or 48px between major sections to maintain an editorial feel.
*   **DON'T:** Use heavy, illustrative icons. Use Lucide-style icons with a 1.5px stroke weight to match the precision of the typography.

---

**Director's Final Note:** This system is not a cage; it is a framework for excellence. When in doubt, ask: "Does this feel like a generic app, or does this feel like a high-performance instrument?" If it feels generic, remove a border and add a tonal shift.```