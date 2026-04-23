# Sprint 4 Requirements Map

This document translates `.plans/Sprint4 (1).md` into a concrete checklist for this repository. It is intended to answer every item in the Sprint 4 brief with:

1. what already exists in the repo,
2. what is still missing or risky,
3. what "done" should mean before submission.

## Repo Baseline

Current project shape:

- Active frontend: Vite + React app in `src/`
- Active backend/runtime server: Express app in `initialApp/`
- Full-stack local run: `npm run dev:full`
- Production-style local run: `npm start`
- Frontend tests: `npm test`
- Combined coverage pipeline: `npm run coverage`

Current Sprint 3-era features already present in code:

- Home, map, timeline, about, quest, and photo hub screens
- Guest mode and `@up.edu` auth flow
- Photo CRUD API and UI
- Timeline CRUD API and UI
- VM deployment scripts and systemd/nginx config
- CI/coverage wiring in `.travis.yml`

## Out-of-Repo Deliverables

These are required by the brief but are not code changes by themselves.

### Sprint lead assessment email

Status: not tracked in git

Done when:

- The Sprint 3 lead emails each teammate
- Each email includes 0-N token allocation
- Each email includes performance feedback
- Instructor is copied if appropriate

### Reflection / retrospective

Status: not yet documented in repo

Done when:

- The team records answers to:
- What went well during the sprint cycle?
- What went wrong during the sprint cycle?
- What could we do differently to improve?

Recommended artifact:

- Add a short retrospective section to a sprint report or meeting notes file in `.plans/`

## Sprint 4 Requirement Matrix

| Requirement from brief | Current evidence in repo | Gap / risk | Done criteria |
| --- | --- | --- | --- |
| Finalize incomplete features | `src/pages/Index.tsx`, `src/components/screens/*`, `initialApp/routes/contentTable.js`, `initialApp/routes/auth.js` show the main UI and backend flows exist | The timeline page still reads static `buildingContent` from `src/data/geoTable.ts` instead of loading timeline data from the backend; timeline writes and reads are not from one source of truth | Timeline reads should come from `/api/content/by-building` or another single backend source and match the CRUD path used for create/update/delete |
| Document known bugs/issues | Some error cases are handled in map, auth, quest, and photo flows | There is no single known-issues document; several concrete repo issues remain undocumented | Add a known-issues section to `README.md` or a Sprint 4 report and include the issues listed below |
| Story acceptance tests focused on the UI | Existing frontend tests: `src/components/LoginGate.test.tsx`, `src/components/screens/timeline.test.tsx`; legacy Jest tests exist in `initialApp/tests/` | Current UI acceptance coverage is still thin and not explicitly organized as story-level acceptance tests | Add story-based frontend tests for the core user journeys listed in the acceptance test section below |
| Test on 3 desktop browsers and 1 mobile browser | The app is browser-based and geolocation/fullscreen tests exist in legacy code | No compatibility matrix or recorded browser results is in the repo | Record pass/fail notes for Chrome, Firefox, Safari, and one mobile browser in `README.md` or a Sprint 4 report |
| Add performance testing and report main-page display time | No explicit performance instrumentation is present in the active React app | Performance requirement is currently unmet in a measurable way | Add timing instrumentation for the primary landing/data page and record measured results before Sprint 5/final |
| Create deployment build | `npm run build` exists in `package.json`; Express serves `dist/` from `initialApp/app.js` | Build exists, but deployment verification should be explicitly documented | Build succeeds locally and on the VM, and the built frontend is served by Express without manual patching |
| Write a deploy/install script | `deploy/setup-vm.sh`, `scripts/start-server.sh`, `scripts/vm-start.sh`, `deploy/cs341-avr.service`, and nginx config already exist | Deployment scripts need to be treated as the official install path and verified end-to-end | The team can provision a VM from repo state using the documented script sequence without undocumented manual steps |
| Monetization | No monetization feature is visible in the current UI | Requirement currently appears unmet | Add a minimal monetization mechanism such as a support/donation link, subscription CTA, or ad placeholder with clear UI copy |
| Test functions for each feature | Frontend Vitest and legacy Jest suites exist | Feature coverage is uneven; some current React features do not have direct test coverage | Each major feature area has at least one test path: auth, guest mode, map/manual building selection, timeline, photo hub, quest |
| Graceful error handling | Auth fallback exists in `src/lib/auth-client.ts`; location/scan/photo errors show user-facing messages | Some mismatches and server failure paths still need consistency | All API, auth, upload, location, and QR failures show user-facing fallback states rather than blank or broken UI |
| Continued focus on project quality goals | UI, auth, deployment, and tests are present | Security, performance, and repo consistency still have visible gaps | Address the quality attribute checklist below |
| README timing numbers | Not present in current `README.md` | Requirement unmet | Add measured performance numbers |
| README browser compatibility and known issues | Not present in current `README.md` | Requirement unmet | Add browser matrix and known issues section |
| README final testing coverage and impact of story tests | Coverage scripts exist, but discussion is absent | Requirement unmet | Add a short coverage discussion summarizing current coverage and estimated uplift from acceptance tests |
| README quality attributes discussion | Not present as a named section | Requirement unmet | Add a short section covering security, aesthetics, performance, and deployment reliability |
| README security | Auth and route protection exist, but no discussion is written | Requirement unmet | Add a security section plus fix or document major security issues |
| Bug fixes as reported at end of Sprint 4 | No Sprint 4 bug summary exists yet | Requirement unmet | Create a bug list, fix what is in scope, and note anything deferred |
| Submission from latest GitHub state before class | Standard git-based submission is assumed | Needs a pre-submission checklist | Ensure main is current, CI is green, and README is complete before cutoff |
| Travis/CI successful build state | `.travis.yml` runs `npm run coverage` | Needs verification on latest branch state | CI must be passing on the final submission branch |
| GitHub cleanup | Branch and issue cleanup is not represented in repo files | Needs manual repo hygiene before submission | Close stale issues, merge/delete completed branches, remove dead code, redact secrets |

## Known Bugs / Risks To Document

These should appear in the final Sprint 4 report or `README.md`.

### Confirmed codebase issues

- `RUN.md` is outdated. It says `npm run dev` runs the Express app, but the root `package.json` maps `dev` to Vite only.
- The timeline screen reads static local content from `src/data/geoTable.ts`, but timeline create/update/delete calls use backend routes. The read/write model is inconsistent.
- `initialApp/routes/contentTable.js` exposes `router.post('/')` that accepts raw SQL through `dbRequest`. That is a serious security problem and should be removed or locked down.
- `src/lib/auth-client.ts` falls back to localStorage auth and stores plaintext fallback passwords in the browser when the backend is unavailable. That is not acceptable as a production security model.
- `initialApp/package.json` uses `|| true` in the Jest test command, which can hide backend test failures in CI if not reviewed carefully.
- Monetization is required by the sprint brief but is not implemented in the current UI.
- Browser compatibility and performance reporting are not yet documented.

### Lower-severity product risks

- Photo likes/comments in the React app are local UI state, not shared backend state.
- Deployment is HTTP-first by default; HTTPS is optional rather than the default path.
- There is still naming confusion between the active server and the `initialApp/` folder name.

## Story Acceptance Test Set

The sprint brief asks for story acceptance tests focusing on the UI. The following set is appropriate for this repo.

### Required acceptance stories

1. Guest user can open the app, choose "Continue as Guest", and browse without write access.
2. New `@up.edu` user can sign up and receive a verification link flow.
3. Verified user can sign in and see authenticated UI state.
4. User can open the map, select a building, and navigate to that building’s timeline.
5. User can view a building timeline and move backward/forward through timeline entries.
6. Authenticated user can add, edit, and delete a timeline entry.
7. User can browse archive photos and filter them by year grouping.
8. Authenticated user can upload, edit, and delete a photo.
9. User can open the quest screen and collect a stamp through QR/manual input flow.
10. Error states are visible for auth failure, photo load failure, camera failure, and location denial.

### Recommended active test file targets

- `src/components/LoginGate.test.tsx`
- `src/components/screens/timeline.test.tsx`
- Add new tests for `photohub.tsx`
- Add new tests for `quest.tsx`
- Add new tests for guest/auth transitions around `LoginGate`

## Browser Compatibility Matrix

This must be filled in with actual manual results before submission.

| Browser | Platform | Core flows to verify | Result | Notes |
| --- | --- | --- | --- | --- |
| Chrome | Desktop | auth, guest mode, map, timeline, photo upload, quest | TODO |  |
| Firefox | Desktop | auth, guest mode, map, timeline, photo upload, quest | TODO |  |
| Safari | Desktop | auth, guest mode, map, timeline, photo upload, quest | TODO |  |
| Safari or Chrome | Mobile | guest mode, map/manual building choice, quest scanner fallback, photo browsing | TODO |  |

Document at least:

- any layout issues,
- camera/geolocation permission differences,
- upload differences,
- QR scanning behavior,
- animation/performance differences.

## Performance Requirement

The brief asks for timing for the main page. For this repo, measure one of the following and record the result:

- Home screen first meaningful display time, or
- First full render of the primary history/data page, or
- Timeline page render after building selection

Recommended implementation:

- Use `performance.mark()` and `performance.measure()` in the active React entry path
- Log results in development and capture a documented average over several runs
- Include results in `README.md`

Recommended report format:

| Page / flow | Environment | Runs | Average | Worst | Notes |
| --- | --- | --- | --- | --- | --- |
| Home screen initial load | local dev | TODO | TODO | TODO |  |
| Timeline screen after building select | local dev | TODO | TODO | TODO |  |
| Production VM build | deployed VM | TODO | TODO | TODO |  |

## Deployment / Install Requirement

Existing deployment assets:

- `deploy/setup-vm.sh`
- `deploy/cs341-avr.service`
- `deploy/cs341avr.campus.up.edu.nginx.conf`
- `scripts/start-server.sh`
- `scripts/vm-start.sh`

Done criteria:

- `npm run build` succeeds
- `npm start` serves the built app through Express
- VM setup script completes without undocumented manual edits
- systemd service starts cleanly
- nginx config validates and proxies correctly
- README documents the official deployment path

## Monetization Requirement

Current status: not implemented

Minimum acceptable Sprint 4 implementation:

- Add a visible support/donation/subscription CTA on the home or about screen
- Add a short explanation of how the app could be sustained financially

Good-enough options for this class project:

- "Support the archive" donation link
- Alumni subscription or sponsor CTA
- Static ad/sponsor banner placeholder with attribution

## Quality Attributes Discussion

This should become a short final section in `README.md`.

### Security

Keep:

- `@up.edu` restriction
- cookie-based backend auth
- auth-required protection on timeline/photo mutation routes

Fix or document:

- remove the raw SQL passthrough route in `initialApp/routes/contentTable.js`
- stop treating localStorage fallback auth as production-safe
- verify no secrets remain in tracked files

### Performance

Keep:

- Vite frontend build
- static asset bundling for archive images

Add:

- measured timing numbers
- one documented performance benchmark flow

### Aesthetics / usability

Keep:

- animated screen transitions
- clear guest/auth split
- mobile-friendly screen-based navigation

Verify:

- mobile layout stability
- long-text timeline rendering
- upload and modal usability

### Reliability / deployment

Keep:

- Express serving `dist/`
- VM startup scripts
- service and nginx deployment files

Verify:

- app restart behavior after reboot
- missing-backend fallback behavior
- upload directory creation and persistence

## README Update Checklist

The final `README.md` should gain a Sprint 4 or Final Release section containing:

- completed feature summary
- known issues
- browser compatibility matrix
- timing/performance numbers
- testing summary
- coverage summary
- estimated impact of story acceptance tests on coverage
- security discussion
- deployment instructions
- monetization note

## GitHub / Submission Cleanup Checklist

Before submission:

- merge completed work into main
- delete stale branches other than protected branches
- close completed issues
- remove dead code where practical
- verify no sensitive data is committed
- ensure CI is green
- ensure `README.md` is accurate
- tag or clearly identify the final sprint submission commit

## Definition of Done for Sprint 4

Sprint 4 should be considered complete for this repo only when all of the following are true:

- the release candidate features work end to end
- timeline and photo flows have consistent data behavior
- the known issues are documented
- UI acceptance tests cover the core stories
- browser compatibility results are recorded
- performance numbers are measured and written down
- deployment scripts are verified
- monetization is implemented at least minimally
- security risks are fixed or explicitly documented
- README is updated with all Sprint 4 deliverables
- CI is passing on the submission commit
