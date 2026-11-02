# Chuo Moja: self-hosted version

One digital campus for Kenyan universities. Students, lecturers and support staff sign in with their **university email**, get a 6-digit code, and are in. No password.

This folder is the whole site. It has **no npm packages to install**. It needs **Node.js 22.13 or newer** and somewhere to keep one database file.

## What it does that the prototype page could not

| Prototype page | This version |
|---|---|
| Only people the owner shared the page with could use it | Anyone with a valid university email can sign up |
| Roles were self-declared | A `students.` email is auto-confirmed as a student; lecturers and staff are confirmed by your moderators |
| Campus was chosen from a list | Campus comes from the email domain and cannot be faked |
| Access rules lived in the host platform | The server enforces them: owner, campus and time stamps cannot be forged, and only moderators can write the Verified list |
| No way to leave | **Sign out, download my data, delete my account** are in the Me tab |

Everything else (Unit Hubs, Open Lines with live rooms, Lecturer Desk, Staff Guild Hub, Project Lab, campus map) is the same app.

## Try it on your own computer (2 minutes)

```bash
node -v            # must be v22.13 or higher
cp .env.example .env   # optional
MAIL_PROVIDER=console ADMIN_EMAILS=you@uonbi.ac.ke node server.js
```

Open http://localhost:3000, type an email ending in `.ac.ke`, and the 6-digit code **prints in the terminal**. The first account (or any address in `ADMIN_EMAILS`) becomes a moderator.

## Put it on the internet

You need three things: a place to run it, a domain, and an email service. Pick **one** hosting route.

### Route A: a small server (VPS) with Caddy: cheapest, most control
1. Rent a Linux server (1 GB RAM is plenty to start). Install Node 22 and [Caddy](https://caddyserver.com).
2. Copy this folder to the server, copy `.env.example` to `.env`, fill it in.
3. Point your domain's DNS **A record** at the server. Put the domain in `Caddyfile.example`, save it as `Caddyfile`, run `caddy run`.
4. Keep the app running with systemd or `pm2`: `node server.js` reading the `.env` values.

### Route B: Render, Railway or Fly.io: least server work
- **Render:** use `render.yaml`. It needs a paid instance with a 1 GB disk, because the database is a file.
- **Railway / Fly.io:** use the `Dockerfile`. Attach a persistent volume mounted at `/data`.
- Set the environment variables from `.env.example` in the dashboard. Set `TRUST_PROXY=1`.

> **The database is one file** (`DATA_DIR/chuomoja.sqlite`). If your host wipes its disk on each deploy, you lose everyone's data. Always use a persistent disk or volume, and **back the file up daily**: copy the `data/` folder somewhere else.

## Email: how sign-in codes are sent

Choose a provider, create an account, **verify your sending domain** (add the SPF and DKIM records they give you, or codes land in spam), then set:

```
MAIL_PROVIDER=resend        # or brevo, or mailgun
MAIL_API_KEY=...
MAIL_FROM=Chuo Moja <no-reply@yourdomain.co.ke>
```

Resend, Brevo and Mailgun all have free tiers that cover a pilot. Mailgun also needs `MAILGUN_DOMAIN`. These three connections are written but **could not be tested from where this was built** (no internet access to the providers). Send yourself a code first, and watch the server log if anything fails.

## Who is a student, a lecturer or staff?

- An email domain proves **which university** someone belongs to, not their role.
- Emails starting with `students.`, `student.`, `stud.`, `std.`, `stu.` or `learners.` (for example `name@students.uonbi.ac.ke`) are confirmed as **students** automatically. If your university uses a different pattern, edit `isStudentDomain` in `server.js`.
- Everyone else asks a moderator in **Me → Verification**. Moderators see the queue in the same place and press Approve or Reject. Add moderators with `ADMIN_EMAILS` (comma-separated).

## Check the university list before launch

`domains.json` maps email domains to university short names (for example `uonbi.ac.ke` to `UoN`). It is a **starter list from memory: check every line against the university's real mail domain** and add the rest. A valid `.ac.ke` address whose domain is not listed still signs in, but is not assigned a campus automatically.

## Settings

| Variable | What it does |
|---|---|
| `PUBLIC_URL` | Your https address. Makes cookies Secure. |
| `DATA_DIR` | Where the database and secret key live. Keep it on a persistent disk. |
| `ADMIN_EMAILS` | Always-moderators. |
| `ALLOWED_DOMAINS` | Email endings allowed to sign up. Default: `ac.ke,strathmore.edu,aku.edu,cuea.edu`. |
| `TRUST_PROXY` | `1` when behind Caddy, nginx or a host's proxy. |
| `MAIL_PROVIDER`, `MAIL_API_KEY`, `MAIL_FROM` | Email sending. |
| `SITE_NAME` | Shown in emails. |

## Safety built in
- Codes expire in 10 minutes, lock after 5 wrong tries, and can be requested once every 45 seconds, with per-address and per-visitor limits.
- Sessions are 30-day, HTTP-only cookies. Writes need an app-only header, which blocks cross-site form attacks.
- Server-side rules: nobody can edit or delete another person's content except moderators; each person can only write their own RSVP; role claims are readable only by moderators and the claimant; size and rate limits on writes, chat and rooms.
- Content-Security-Policy and other security headers on every page.
- Emails are never sent to other users' browsers.

## Before you open it to students (not optional)
1. **Privacy and the law.** Edit `public/privacy.html` (fill the operator box) and have a lawyer review it against the **Kenya Data Protection Act, 2019**. Find out whether your organisation must register with the **Office of the Data Protection Commissioner**.
2. **Moderators.** Decide who reviews reports and role claims, and how fast. The "report" path today is: moderators remove content from the app. Agree rules with the universities involved.
3. **Backups.** Test restoring the `data/` folder on a second machine once.
4. **Safeguarding.** Users may be under 18 (first-year students). Agree a policy for how reports of harassment are handled and escalated.
5. **Pilot first.** Start with one or two campuses, then widen.

## Limits you should know about
- **One server.** Live rooms and chat are held in memory by one process. That comfortably serves hundreds of people at once; thousands of simultaneous users would need a bigger redesign.
- **No voice or video.** Open Line hosts add their own Google Meet, Zoom or WhatsApp link; the room covers who is here, chat and raised hands. Built-in calling is a separate project.
- **Chat is not stored.** It disappears when the room closes, by design.
- **Everything is public to signed-in users** except email addresses and role claims. Direct private messages between people are not part of this version.

## Changing the app
The app source is in `src/`. After editing, run `./build.sh` to rebuild `public/index.html`. The server is `server.js`; the browser connector is `shim.js`.
