# Theme

The site opens dark whatever the visitor's OS prefers. A toggle in the Identity column switches to light, and the choice persists across pages and reloads.

## Sub-features

- `theme-default` first visit is dark, even when the OS asks for light.
- `theme-toggle` the toggle switches to light and its name flips.
- `theme-persist` light stays after a reload and on other routes.

## How to get to it (user POV)

- Choose `Switch to light theme` (then `Switch to dark theme`) in the Identity column on any page.

## Driving it with verify.mjs

Preconditions:

- `doctor` prints `OK`.

- **Default.** Run `verify.mjs shot --name dark --run theme`. The JSON shows `theme: "dark"`.
- **Stored light.** Run `verify.mjs shot --name light --theme light --run theme` and `verify.mjs shot resume --name resume-light --theme light --run theme`. Both JSON records show `theme: "light"`.
- **Toggle click.** Not in the helper: run `npx playwright test -g "theme starts dark"` against a fresh build.

## Gotchas

- `--theme light` presets what the toggle stores; it proves the stored choice is honoured, not that the toggle writes it.
