# Sprint 4 Release Checklist

## Implemented In Repo

- Timeline reads use the backend route `/api/content/by-building` first.
- Timeline CRUD routes remain active through `/api/content/timeline`.
- Timeline fallback uses bundled archive entries only when the backend is unavailable.
- The generic SQL passthrough route is disabled and returns `410 Gone`.
- Home and about screens include a monetization preview.
- Performance hooks record `home-screen-initial-render` and `timeline-screen-render`.
- UI story tests cover login/guest mode, timeline flows, photo hub flows, and quest fallback flows.
- `npm test` passes.
- `npm run test:coverage` passes.
- `npm run build` passes.
- Sprint retrospective is written in `.plans/02-sprint4-retrospective.md`.
- `README.md` is updated for the release candidate state.

## Manual Browser Sign-Off

- Open the app in Chrome desktop and verify login, guest mode, map navigation, timeline, photo hub, quest, and support CTA.
- Open the app in Firefox desktop and verify the same flows.
- Open the app in Safari desktop and verify the same flows.
- Open the app in one mobile browser and verify the same flows.
- Record any browser-specific issues in `README.md` before submission.

## Performance Sign-Off

- Start the app with `npm run dev:full`.
- Open DevTools in the browser.
- Capture `window.__avrMetrics` after loading the home screen.
- Navigate to a building timeline and capture `window.__avrMetrics` again.
- Record representative values for `home-screen-initial-render` and `timeline-screen-render` in `README.md`.

## Deployment Sign-Off

- Run `npm start` locally and confirm the built frontend is served from Express on port `4000`.
- Run `sudo bash deploy/setup-vm.sh` on the target Linux VM.
- Verify `systemctl status cs341-avr`.
- Verify `systemctl status nginx`.
- Open `http://cs341avr.campus.up.edu/` or the VM IP and confirm the deployed app loads.

## Submission Cleanup

- Confirm CI is green on the final pushed branch.
- Close or document stale GitHub issues.
- Merge or delete stale branches that are no longer needed.
- Confirm no secrets or environment-specific credentials are committed.
- Send the required sprint lead / assessment emails outside the repo workflow.
