# Sprint 4 Retrospective Draft

## What Went Well

- The project now has a clear React frontend with distinct screens for map, timeline, photo hub, quest, auth, and about flows.
- Deployment work is materially ahead of a typical class project: systemd, nginx, VM bootstrap, and production-style startup scripts already exist.
- The app has useful user-facing fallback behavior for auth, geolocation, QR scanning, and API failures instead of failing silently.

## What Went Wrong

- The timeline feature drifted into a split data model: frontend static reads and backend CRUD writes were no longer aligned.
- Repo documentation lagged behind implementation, especially `RUN.md` and the missing Sprint 4 release evidence in `README.md`.
- One backend route allowed generic SQL execution, which created an avoidable security risk late in the sprint.

## What We Should Do Differently

- Keep read and write paths on the same source of truth as soon as a backend route exists.
- Treat release documentation as part of each sprint, not as a final cleanup step.
- Add issue-driven hardening checks near the end of each sprint:
- auth mode review
- unsafe route review
- README accuracy review
- browser/performance evidence review
