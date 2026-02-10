# NPM Audit – Risk Acceptance (Moderate Only)

**Date:** 2025-02-10  
**Branch:** fix/npm-audit-v1  
**Goal:** 0 critical, 0 high. Moderate may remain only if documented as not exploitable and with a planned fix version.

---

## 1. electron &lt;35.7.5 (moderate)

- **Advisory:** [GHSA-vmqv-hx8q-j7mg](https://github.com/advisories/GHSA-vmqv-hx8q-j7mg) – ASAR Integrity Bypass via resource modification.
- **Why not exploitable in this app:** Attack requires an attacker to modify ASAR contents after build and before or during user run; we do not load untrusted ASARs or allow third-party ASAR replacement in normal use. Packaged app is signed/distributed via controlled channels.
- **Planned removal:** Upgrade to `electron@35.7.5` or later when we next do a major Electron bump (e.g. with next LTS). Current pin: `^28.3.3` for stability; upgrade will be done in a dedicated Electron upgrade pass.

---

## 2. esbuild &lt;=0.24.2 (moderate) – via vite

- **Advisory:** [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) – dev server can be made to send requests and read responses.
- **Why not exploitable in this app:** Affects **development** server only. Production build does not include the dev server; end users run the built Electron app, not `vite` or esbuild. Dev is used only on developer machines.
- **Planned removal:** Upgrade to `vite@7.x` (or whatever version pulls esbuild &gt;0.24.2) in a future dev-deps refresh. Current: `vite@^5.4.2`.

---

## 3. nodemailer &lt;=7.0.10 (moderate) – 2 advisories

- **Advisories:** [GHSA-mm7p-fcc7-pg87](https://github.com/advisories/GHSA-mm7p-fcc7-pg87) (email to unintended domain), [GHSA-rcmh-qjqh-p98v](https://github.com/advisories/GHSA-rcmh-qjqh-p98v) (addressparser DoS).
- **Why not exploitable in this app:** Nodemailer is used in the **backend** only, with fixed/validated recipient lists and server-side config. We do not pass user-controlled address strings directly into nodemailer in a way that triggers the interpretation conflict; backend is not exposed to arbitrary attacker-controlled input for email routing. DoS is limited to the backend process and is mitigated by normal deployment controls.
- **Planned removal:** Upgrade to `nodemailer@8.0.1` (or next patched 8.x) in the next backend dependency update. Current: `^6.9.9`.

---

## Summary

| Package   | Severity | Not exploitable because                          | Plan to remove              |
|----------|----------|---------------------------------------------------|-----------------------------|
| electron | moderate | No untrusted ASAR; controlled distribution       | Bump to 35.7.5+ with next Electron upgrade |
| esbuild  | moderate | Dev-only; prod build does not use dev server       | Bump via vite 7.x when updating dev deps  |
| nodemailer | moderate | Backend-only; validated recipients; no user-controlled routing | Bump to 8.0.1+ in backend update |

All moderate findings are accepted with the above justification and planned version for removal.
