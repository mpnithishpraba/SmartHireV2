# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A recruiter runs SmartHire on their own computer and drives the whole workflow: defining roles, screening resumes, reviewing scores, and rating interview answers. For the assessment steps (aptitude test, coding challenge, interview, face check), the recruiter hands the same machine to the candidate, who works through the test and hands it back. The recruiter is the primary user; the candidate is a temporary guest on recruiter-owned screens. (Confirmed for now; the user flagged this split as provisional.)

## Product Purpose

One offline workspace that takes a candidate from resume to a recruiter decision: weighted resume match, aptitude test, coding challenge, structured interview, and an explainable per-phase score breakdown with a downloadable PDF report. Success is a recruiter who can see why a candidate scored what they did, and who makes the final call themselves.

## Positioning

Everything runs on the recruiter's machine. Resume parsing, question banks, face comparison, Whisper transcription and text-to-speech are bundled locally, no paid or cloud API is called, and the server binds to 127.0.0.1. Scores are explained, not oracular: each phase shows its contribution (phase score × weight), interview answers get no automatic quality score until a recruiter rates them on a 0–4 rubric, and the face check reports uncalibrated cosine similarity, never a probability.

## Operating Context

- Current use: a college project (IDL) demonstrated live to evaluators. A clear walkthrough and a strong first impression matter most right now.
- Four-step flow: 1 Job setup → 2 Add candidate → 3 Assess (resume match, face check, aptitude, coding, interview) → 4 Recruiter dashboard.
- Demo aids: role templates (`app/unified/role_presets.json`) and three fictitious example resumes (`examples/resumes/`, `app/unified/resume_examples.json`).
- Started with `START_SMARTHIRE.cmd` or `python app/main.py`; opened at `http://127.0.0.1:5000`.

## Capabilities and Constraints

- Flask backend (`app/unified/app.py`), single-page frontend (`app/unified/index.html`), SQLite storage, no build step and no JS framework.
- Fully offline at runtime: no CDN scripts, hosted fonts or remote assets. Any font or asset must be bundled in the app.
- Camera and microphone are used in the browser for the face check and recorded answers; video is never saved.
- The coding runner is time-limited but not a secure sandbox; the UI must keep that warning.
- No recruiter authentication yet. Not a release-ready HR product.
- Terminology: role, candidate, Phase 1 / resume match, aptitude, coding, interview, rubric rating, overall score, face check (match / no match / inconclusive).

## Brand Commitments

- Product name: **SmartHire**. The full title "SmartHire — AI Recruitment Platform" appears exactly once in the interface; everywhere else it is just SmartHire.
- No other visual identity carries over: the previous look (teal gradients, glass, glow) is not binding.

## Evidence on Hand

- Fictitious sample candidates: Ananya Sharma, Priya Nair, Rohan Mehta (PDFs in `examples/resumes/`). They are labelled fictitious and must stay so.
- No real customers, testimonials, accuracy benchmarks or hiring outcomes exist. Do not invent any.

## Product Principles

1. The recruiter decides; SmartHire shows evidence. Every score has a visible reason.
2. Honest about uncertainty: pending, needs-review and inconclusive states are first-class, never hidden or dressed up as results.
3. Local and private by construction, stated plainly rather than marketed.
4. One continuous workflow: each step leads into the next, using the same candidate record.

## Accessibility & Inclusion

Candidates of any background take timed tests on a borrowed screen, so instructions must be plain, controls keyboard-operable, and the timer and recording states unmistakable. Reduced-motion preferences must be respected.
