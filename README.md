[![Codecov Coverage](https://img.shields.io/codecov/c/github/upcs/cs341-spring-2025-cs341_sp25_avr/main.svg?style=flat-square)](https://codecov.io/gh/upcs/cs341-spring-2025-cs341_sp25_avr)

# Campus History Web App

This README is the **Sprint 5 / Alpha release report** for the University of Portland 125th Anniversary Campus History web app.

# Review your requirement document

From our requirement document, we mainly focused on specifying performance output and general speed of our website. Some things in particular that were highlighted is that the response times of buttons when clicked should direct you to another page in no more than 2-3 seconds. Upload for photos also shouldn't take more than 5 seconds to process into the website. Our efforts to improve these metrics was to firstly, sort of rewirte our entire code base from html to typescript. We found that typescript offers more reliable performance and higher output speeds than html for large end websites. This helped improve our response time overall. For the photo uploads, we implemented some type of authentication where a user can only upload images if it's within a certain size, this is mainly due to preventing large uploads from happening which might slow down the website performance.

### Website Link:
[Campus History Web Application](http://cs341avr.campus.up.edu/)

- `https://cs341s26upadv.campus.up.edu/`

Users can watch the home page video, open the campus map, read building timelines, browse and submit photos, use the campus quest, continue as a named guest, or sign in with an `@up.edu` account.

## How To Run

Install packages:

```bash
npm install
npm --prefix initialApp install
```

Run frontend and backend together:

```bash
npm run dev:full
```

Run the production-like Express build:

```bash
npm start
```

Run checks:

```bash
npm run build
npm run coverage
```

## Sprint 5 Performance

Measurement method: local production build served by Express on `http://localhost:4000/`. The HTTP timing numbers are `curl` transfer timings on localhost, so they are best for comparing this sprint's before/after asset cost, not for predicting a real user's network time.

| Measurement | Before Sprint 5 | Final Sprint 5 |
| --- | ---: | ---: |
| Production build time | 2.39 s | 2.11 s |
| Main entry JS | 899,338 bytes | 473,719 bytes |
| Main entry JS gzip | 272.89 kB | 152.65 kB |
| Main CSS | 85,678 bytes | 70,642 bytes |
| Main CSS gzip | 18.65 kB | 12.17 kB |
| HTML transfer | 0.007802 s | 0.006891 s |
| Main JS transfer | 0.005033 s | 0.003620 s |
| Main CSS transfer | 0.001459 s | 0.002306 s |
| HTML + main JS + main CSS transfer | 0.014294 s | 0.012817 s |

Runtime improvement made: the app now lazy-loads non-home screens and separates lightweight building coordinates from heavy archive/timeline image metadata. This removed the Vite large-chunk warning and reduced the blocking main JS by 425,619 bytes, about 47.3%.

## Browser Compatibility

Compatibility work completed:

- The map now uses a graceful geolocation denial path with a manual building chooser, so Firefox/Safari users who block location can still reach building timelines.
- The home video has an autoplay fallback button for mobile Safari and other browsers that require a user gesture before video playback.
- Lazy-loaded screens use a loading fallback instead of showing a blank screen on slower browsers.
- `requestIdleCallback` preloading has a `setTimeout` fallback for browsers without that API.
- API failures in timeline/photo flows show user-facing fallback content or error messages instead of crashing.

Known issues:

- OpenStreetMap tiles require network access; the map shell still loads, but map imagery may be blank offline.
- Camera-based quest scanning still depends on browser camera support and user permission.
- The background video may need a tap on stricter mobile autoplay settings.
- Manual browser smoke testing should still be repeated on Chrome, Firefox, Safari, and one mobile browser immediately before final submission.

## Test Coverage

Final automated coverage from `npm run coverage`:

| Area | Tests | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: | ---: |
| Frontend Vitest | 42 | 90.80% | 76.53% | 91.76% | 90.80% |
| Backend Jest | 89 | 93.26% | 81.52% | 94.80% | 93.31% |

Quality of testing beyond the number:

- Story-style UI tests cover home navigation, guest/auth flows, map geolocation denial, timeline fallback content, photo hub filtering/upload/moderation states, quest scan-only behavior, and not-found routing.
- Data tests exercise archive SQL parsing and broken-image filtering instead of only testing rendered components with mocks.
- Security-focused tests verify local fallback passwords are not stored as plaintext and photo uploads enforce size/type protection.
- Backend route tests cover successful responses, validation failures, authentication/authorization failures, database failures, and graceful JSON error responses.

Story acceptance tests increase the computed coverage by 0% when they are manual only. If the remaining manual acceptance scripts were automated, estimated frontend coverage would likely increase another 3-5 percentage points because they would exercise more `LoginGate`, photo moderation, and timeline edit branches.

## Quality Attributes

Performance: reduced the landing-page blocking JS payload and removed the large-chunk build warning by code-splitting screens and moving shared building data into a lightweight module.

Reliability and graceful error handling: the app now has explicit loading states for lazy screens, better map fallback behavior, bundled timeline fallback content when the live archive is unavailable, and JSON API errors for API clients.

Aesthetics and usability: the home page keeps the video-forward visual design while avoiding blank states; users who deny location or video autoplay receive a clear next action.

Maintainability: heavy archive data is isolated from common building coordinates, so future feature screens can import the light data without accidentally pulling the full archive manifest.

## Security

Security work completed this sprint:

- Added Express security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, production/HTTPS `Strict-Transport-Security`, and disabled `X-Powered-By`.
- Restricted photo uploads to JPEG, PNG, GIF, and WebP MIME types with a 5 MB server-side limit and JSON error responses for rejected uploads.
- Kept uploaded filenames sanitized and timestamp-prefixed.
- Changed frontend offline fallback auth from plaintext localStorage passwords to salted PBKDF2-SHA256 hashes. Backend auth already uses `scrypt` password hashes and `HttpOnly` cookies.
- Confirmed `.env`, dev certificates, generated coverage, uploads, and SSL key files are ignored by `.gitignore`.

Security references:

- OWASP HTTP Security Response Headers Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- OWASP Content Security Policy Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- OWASP HTML5 Security Cheat Sheet, Local Storage guidance: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- OWASP Input Validation Cheat Sheet, Upload Verification: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html

## Bug Fixes And Testing Follow-Through

Peer/client testing follow-through completed in this codebase:

- Fixed the main-page performance issue by reducing the initial bundle and documenting before/final timing.
- Fixed geolocation denial dead-end by adding manual building selection.
- Fixed video autoplay dead-end by adding a tap-to-play fallback.
- Fixed photo upload risk by enforcing image type and size limits.
- Fixed local fallback auth risk by removing plaintext password storage.
- Fixed coverage failure on real archive data by adding direct data/parser coverage.
- Fixed graceful error behavior for API routes by returning JSON for API errors.

GitHub issue numbers are not available in this local checkout. Before final submission, close the matching GitHub issues and link those issue numbers here if the team has a separate issue list.

## Sprint 5 Reflection

What went well: the team had enough existing feature code to focus this sprint on release quality: tests, security, performance, and graceful fallbacks. The coverage pipeline now passes for both frontend and backend.

What went wrong: the app still had heavy data coupling, so the home page was paying for archive/timeline assets before users needed them. Browser testing evidence is also not as complete as the code-level compatibility work.

What to do differently: split heavy data/features earlier, keep README release evidence current during the sprint instead of at the end, and turn manual story acceptance tests into automated browser tests sooner.
