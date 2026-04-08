# SEC_START Setup Guide

A customizable cybersecurity start page with themes, OSINT-heavy search modes, security feeds, bookmarks, workspace tabs, and a roadmap panel.

![alt text](image.png)

## Recommended Browser
Vivaldi is recommended because it handles custom start pages and tab/startup behavior very cleanly.

## Quick Setup in Any Browser

1. Download or copy this folder to your machine.
2. Keep these files together in one folder:
   - startpage.html
   - config.json
   - config.html
3. Open startpage.html in your browser.
4. Set it as your start page/home page using your browser settings.
5. Optional: Pin the tab so it always opens quickly.

## Release Notes (Current)

- Parent-hosted ATT&CK quiz now follows active MITRE page context (Enterprise, Mobile, ICS).
- Quiz loading stability improved to avoid multi-load question flicker.
- Config page supports auto-save and collapsible sections for easier editing.
- Workspace webpage tabs support custom entries with improved merge behavior from saved config.
- RGB mode expanded across main layout, controls, quiz UI, and local MITRE iframe visual response.
- Added footer GitHub shortcut (bottom-right) to the project repo.

## Best Setup for Vivaldi 🌐

1. Open Vivaldi Settings.
2. Go to Homepage.
3. Set Homepage to the local file path for startpage.html.
4. Go to Startup.
5. Choose Open a specific page or set of pages and add the same file path.
6. Restart Vivaldi and confirm the page loads on launch.

## Customize Content and Theme 🎨

1. Open config.html.
2. Edit dropdowns, search modes, feeds, themes, bookmarks, and workspace pages.
3. Save your changes.
4. Reload startpage.html.

## Workspace Webpage Limitation (Important)

- Some websites will not load inside the workspace iframe tabs.
- This is expected when the target site sends anti-embedding security headers such as:
   - `X-Frame-Options`
   - `Content-Security-Policy` with `frame-ancestors`
- If a site is blocked, use the external-link button in the tab header.

## Notes on Saved State

- Runtime preferences may be saved in browser local storage.
- If you changed config but do not see updates, do a hard refresh.
- If needed, clear site storage for the local file and reload.

## Browser Compatibility

This project is designed for modern desktop browsers and should run on your machine without extra installs when files are kept together.

- Best experience: Chromium-based browsers (Vivaldi, Edge, Chrome, Brave, Arc).
- Also supported: modern Firefox.
- Safari may work, but local-file behavior and iframe restrictions can vary by version and OS policy.

### What is browser-dependent

- Embedded third-party pages (iframe policy is controlled by the destination site, not this project).
- Local file permissions and localStorage behavior can be stricter in some browser privacy/security modes.

### Verification Checklist Before Sending

1. Open `startpage.html` and hard refresh once.
2. Toggle RGB mode and confirm: top bar, tabs, quiz, and MITRE local iframes visibly react.
3. Open `config.html`, change one setting, confirm auto-save works, then reload `startpage.html`.
4. Confirm workspace custom tabs appear and load.
5. Confirm bottom-right GitHub icon opens: `https://github.com/GameSmithOnline/Sec_Start`.

## ATT&CK Universal Quiz Bubble

- The quiz now opens as a bottom-right bubble in `mitre-attack-copy.html`.
- You can deep-link to auto-open it with a dataset:
   - `mitre-attack-copy.html?quiz=1&dataset=enterprise-attack-18.1.json`
   - `mitre-attack-copy.html?quiz=1&dataset=mobile-attack-18.1.json`
   - `mitre-attack-copy.html?quiz=1&dataset=ics-attack-18.1.json`


## Troubleshooting

- Page opens but no styling: confirm all files are in the same folder.
- Theme looks wrong: reload and verify activeTheme in config.json.
- Feeds empty: verify network access and feed URLs in config.json.
