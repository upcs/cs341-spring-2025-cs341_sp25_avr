[![Codecov Coverage](https://img.shields.io/codecov/c/github/upcs/cs341-spring-2025-cs341_sp25_avr/main.svg?style=flat-square)](https://codecov.io/gh/upcs/cs341-spring-2025-cs341_sp25_avr)

# Campus History Web Application

The Campus History Web Application is an interactive archive for the University of Portland. Users can browse location history, archive photos, and a campus stamp quest from a mobile-friendly React app. The production runtime is a Vite-built frontend served by the Express app in `initialApp/`.

Website: [http://cs341avr.campus.up.edu/](http://cs341avr.campus.up.edu/)

## Sprint 4 Release Candidate Summary

Completed release-candidate work:
- Timeline reads are now backend-first through `/api/content/by-building`, with bundled archive entries used only as fallback when the backend is unavailable.
- Timeline create, update, and delete continue through the authenticated `/api/content/timeline` routes.
- The unsafe generic SQL passthrough route was disabled and now returns `410 Gone`.
- Guest mode, authenticated mode, photo hub, and quest flows now have expanded UI tests.
- The quest screen now exposes manual QR fallback errors on the main screen instead of only inside the camera modal.
- A lightweight monetization preview was added through the "Support The Archive" CTA and sponsor tiers.
- Performance instrumentation was added for home render and timeline render events.
- Sprint 4 planning and retrospective docs live in `.plans/`.

Key product areas:
- Home
- Map / building selection
- Timeline
- Photo Hub
- Campus Stamp Quest
- Login, signup, guest mode, and password reset flows

## Run Locally

Install dependencies:

```bash
npm install
npm --prefix initialApp install
```

Development modes:

```bash
npm run dev
npm run dev:full
```

- `npm run dev` starts the Vite frontend on `http://localhost:3000`
- `npm run dev:full` starts the frontend on `3000` and the Express backend on `4000`

Production-style local run:

```bash
npm start
```

`npm start` builds the frontend and serves it from the Express server on `http://localhost:4000`.

## Deployment

VM deployment entrypoint:

```bash
sudo bash deploy/setup-vm.sh
```

What it configures:
- installs the `deploy/cs341-avr.service` systemd unit
- installs the `deploy/cs341avr.campus.up.edu.nginx.conf` Nginx site
- restarts the app service
- reloads Nginx

Useful commands:

```bash
systemctl status cs341-avr
systemctl status nginx
npm start
```

## Testing And Coverage

Automated checks run in this repo snapshot:

```bash
npm test
npm run test:coverage
npm run build
```

Results from this implementation pass:
- `npm test`: 6 test files, 16 tests passed
- `npm run test:coverage`: passed
- `npm run build`: passed
- `npm --prefix initialApp test`: passed
- `npm --prefix initialApp run test:strict`: passed

Story-focused coverage improved for the key Sprint 4 screens:
- `src/components/LoginGate.tsx`: 75.08% statements
- `src/components/screens/geo.tsx`: 56.31% statements
- `src/components/screens/timeline.tsx`: 70.30% statements
- `src/components/screens/photohub.tsx`: 71.11% statements
- `src/components/screens/quest.tsx`: 59.73% statements

Sprint 4 story tests materially improved coverage of the release-critical flows that were weak or missing before this pass: guest auth, manual building selection, backend timeline loading/fallback, authenticated timeline creation, photo hub browsing/filtering/upload entry, and quest manual QR fallback. Current total frontend statement coverage is still low at 18.83% because the project includes many generated/shared UI primitives and untouched screens that are not yet covered by story tests.

## Browser Compatibility

Target browsers for Sprint 4 sign-off:

| Browser | Target |
|---|---|
| Chrome (desktop) | Supported |
| Firefox (desktop) | Supported |
| Safari (desktop) | Supported |
| Mobile Safari / Chrome Android | Supported |

This shell session implemented the browser-check checklist and automated UI tests, but it did not perform native manual browser sign-off. Final manual verification steps are listed in `.plans/03-sprint4-release-checklist.md`.

## Performance Measurement

Instrumentation is now recorded through `src/lib/performance.ts`.

Tracked metrics:
- `home-screen-initial-render`
- `timeline-screen-render`

Where to read them:
- open the app in a browser
- use DevTools console during development, or inspect `window.__avrMetrics`
- the metric buffer stores the most recent 20 measurements

This implementation added the measurement hooks but did not fabricate browser timing numbers from a non-browser shell environment. Capture the final release timing values on the target device/browser mix before submission and record them in the sign-off checklist.

## Security Notes

- Production auth is the backend session/cookie flow in `initialApp/auth.js` and `/api/auth/*`.
- Browser-local auth fallback still exists so the frontend can run when the backend is unavailable, but that mode is for demo/offline resilience and is not a production security boundary.
- Timeline and photo mutations remain behind `requireAuth`.
- The old generic SQL execution endpoint in `initialApp/routes/contentTable.js` is disabled.
- Uploaded files are stored under `initialApp/public/uploads`.

## Monetization

Sprint 4 includes a minimal monetization preview rather than a live payment integration:
- a "Support The Archive" call to action on the home screen
- sponsor/support tiers on the about screen

This satisfies the release-candidate requirement to show a monetization direction without introducing payment-processing scope late in the project.

## Known Issues

- If the backend is offline, timeline reads fall back to bundled archive notes. This keeps the app usable, but backend data remains the source of truth in production.
- Browser-local auth fallback can authenticate demo users without the backend. That is intentional for offline/demo mode only.
- The production frontend bundle is large. Current build output includes an `854.95 kB` minified JS chunk, and Vite warns that code-splitting should be improved.
- Cross-browser manual sign-off still needs to be completed on real browsers before final submission.

## Sprint 4 Docs

- Requirements map: `.plans/01-sprint4-requirements-map.md`
- Retrospective: `.plans/02-sprint4-retrospective.md`
- Release sign-off checklist: `.plans/03-sprint4-release-checklist.md`
