# SmartHire

**AI recruitment platform: one workspace from job opening to shortlist.**

SmartHire puts role setup, resume screening, aptitude and coding tests, a structured interview and an identity check onto one candidate record. Recruiters compare every applicant on the same evidence, rate interviews by hand or with AI help, and shortlist the top applicants in one step.

It runs on your own computer at `http://127.0.0.1:5000`. Candidate data is stored locally in SQLite.

---

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation (Windows)](#installation-windows)
- [Installation (macOS / Linux)](#installation-macos--linux)
- [Starting and stopping](#starting-and-stopping)
- [How to use it](#how-to-use-it)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Data and privacy](#data-and-privacy)
- [Running the tests](#running-the-tests)
- [Limitations](#limitations)

---

## Features

**For recruiters**

| Feature | What it does |
|---|---|
| Roles | Create a role from a template or from scratch. Type the required and preferred skills, or pull them from a job-description **PDF** or a **CSV**. Set scoring weights and test difficulty. |
| Resume screening | Scores each resume on skills, experience, education, certificates, location and shift, quotes the evidence, and flags details to confirm. |
| Interview rating | **Option 1:** rate each answer yourself on a 0–4 rubric. **Option 2:** *Rate with AI*, which suggests a rating and a reason for each answer. You review and confirm. |
| Dashboard | Ranks applicants by weighted overall score, with per-phase breakdowns and a downloadable PDF report. |
| Shortlist | Tick applicants or use **Select top N**, then **Confirm selection**. |
| Reset | **Reset all progress** clears every role and applicant (a backup is saved first). |

**For applicants**

| Feature | What it does |
|---|---|
| Openings | Lists every open role. **Apply now** opens the application form with that role already chosen. |
| Aptitude test | Timed multiple-choice test at easy, medium or hard difficulty. |
| Coding test | A problem run against hidden test cases. |
| Interview | Questions can be read aloud. Type the answer, or record it and have it transcribed locally. |
| Identity check | With consent, a webcam capture is compared with a reference photo (match / no match / inconclusive). |

An **About SmartHire** page (link at the bottom of the sidebar) describes features, how it works, benefits, market availability and the tech stack.

---

## Requirements

| | |
|---|---|
| Operating system | **Windows 10 or 11** recommended. macOS and Linux work, but reading questions aloud needs Windows. |
| Python | **3.11 or newer** (tested on Python 3.14). Get it from [python.org](https://www.python.org/downloads/) and tick **"Add python.exe to PATH"** during setup. |
| Git | To clone the repository: [git-scm.com](https://git-scm.com/downloads). Or use **Code → Download ZIP** on GitHub. |
| Disk space | About 1.5 GB for Python packages, plus about 190 MB for the models. |
| Browser | Chrome, Edge or Firefox. |
| Optional | Webcam (identity check, interview), microphone (spoken answers), a free [Groq API key](https://console.groq.com/keys) (AI features). |

You need internet access for installation. After that, only the optional AI features need it.

---

## Installation (Windows)

Open **PowerShell** and run these steps one at a time.

**1. Get the code**

```powershell
git clone https://github.com/mpnithishpraba/SmartHireV2.git
cd SmartHireV2
```

**2. Create a virtual environment and install the packages** (takes a few minutes)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r app\requirements.txt
```

> If PowerShell says running scripts is disabled, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, then try the activate command again.

**3. Download the models** (about 190 MB, only needed once)

```powershell
python app\download_models.py
```

This downloads the speech-to-text model (Whisper base) and the two identity-check models into `app\models\`. Skip this step if you don't need spoken answers or the identity check; everything else works without it.

**4. (Optional) Turn on the AI features**

```powershell
Copy-Item .env.example .env
notepad .env
```

Paste your Groq key after `GROQ_API_KEY=` and save. Without a key, the app works normally and the *Rate with AI* option is simply hidden.

**5. Start SmartHire**

```powershell
cd app
python main.py
```

Open **http://127.0.0.1:5000** in your browser.

---

## Installation (macOS / Linux)

```bash
git clone https://github.com/mpnithishpraba/SmartHireV2.git
cd SmartHireV2
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r app/requirements.txt
python app/download_models.py        # optional: speech-to-text and identity check
cp .env.example .env                 # optional: add your Groq key for AI features
cd app && python main.py
```

Open **http://127.0.0.1:5000**.

---

## Starting and stopping

**Start** (Windows PowerShell, from the project folder):

```powershell
.\.venv\Scripts\Activate.ps1
cd app
python main.py
```

You can also double-click **`START_SMARTHIRE.cmd`** in the project folder. On macOS or Linux, run `./start_smarthire.sh`.

Keep that window open while you use the app.

**Stop:** press `Ctrl + C` in that window.

**Stop every copy from any PowerShell window** (useful if it was started more than once):

```powershell
Get-CimInstance Win32_Process -Filter "Name like 'python%'" | Where-Object { $_.CommandLine -match 'main\.py' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

**Check whether it's running** (no output means it's stopped):

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
```

> After updating the code, stop the server, start it again, and press `Ctrl + F5` in the browser.

---

## How to use it

The sidebar is split into **Recruiters** and **Applicants**.

### 1. Recruiter: create a role

**Recruiters → Roles.** Pick a template (or fill in the form), add the skills by typing them or by attaching a PDF or CSV, set the weights and difficulty, then click **Save role**. The role now appears under **Openings**.

### 2. Applicant: apply

**Applicants → Openings.** Click **Apply now** on a role. The **Candidate details** form opens with that role selected. Add a name, upload a resume PDF (or paste the text), confirm location and shift, and submit.

To try it quickly, the form has three fictitious sample resumes you can load with one click.

### 3. Applicant: take the assessments

**Applicants → Assessment.** Choose the applicant, then work through the tabs: **Identity**, **Aptitude**, **Coding** and **Interview**. After the interview, the applicant sees *Needs to be reviewed* until a recruiter rates the answers.

### 4. Recruiter: review and rate

**Recruiters → Dashboard.** Click an applicant's name to open their analysis.

- If the resume screen flagged anything (for example a shift conflict), check it and click **Mark as confirmed**.
- Under **Interview answers**, choose **Option 1 · Rate manually** or **Option 2 · Rate with AI**, adjust if needed, and save. The overall score then includes the interview.

### 5. Recruiter: shortlist

Still on the dashboard, enter a number in **Select top N** and click **Apply**, or tick applicants yourself. Then click **Confirm selection**. Shortlisted applicants get a green **Shortlisted** tag. Download a **PDF report** for any applicant from their analysis.

### Starting over

**Reset all progress** (bottom of the sidebar) deletes all roles, applicants and results after you type `RESET`. Sample templates and question banks are kept, and a backup of the old data is saved in `app/unified/backups/`.

---

## Configuration

Settings live in a `.env` file in the project folder (copy `.env.example`):

| Setting | Default | Purpose |
|---|---|---|
| `GROQ_API_KEY` | *(empty)* | Turns on *Rate with AI* and AI skill extraction from PDFs. |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | The Groq model to use. |

Never commit `.env`. It is already listed in `.gitignore`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` is not recognized | Reinstall Python with **"Add python.exe to PATH"** ticked, or use `py` instead of `python`. |
| "Bundled Whisper model is missing" | Run `python app\download_models.py`. |
| "Bundled face models are missing" | Run `python app\download_models.py`. |
| "AI rating is not configured" | Add `GROQ_API_KEY` to `.env` and restart the server. |
| New features missing, or a page says **Not Found** | The server is running old code. Stop it, start it again, and press `Ctrl + F5`. |
| Port 5000 already in use | A copy is already running. Use the **stop every copy** command above, then start again. |
| Resume text not found | The PDF is a scanned image. Use a text-based PDF, or paste the resume text. |
| Questions are not read aloud | Reading aloud uses the Windows voice and only works on Windows. The question is still shown on screen. |
| Camera or microphone blocked | Allow access in the browser's address-bar permissions for `127.0.0.1`. |

---

## Project structure

```text
SmartHireV2/
├── app/
│   ├── main.py                 # Starts the server on http://127.0.0.1:5000
│   ├── download_models.py      # Downloads the optional speech and face models
│   ├── requirements.txt        # Python packages
│   ├── data/                   # Aptitude, coding and interview question banks
│   ├── models/                 # Downloaded models (not in Git)
│   └── unified/
│       ├── app.py              # Flask API: scoring, tests, AI rating, reports
│       ├── face_verify.py      # Identity check (OpenCV SFace + MediaPipe)
│       ├── index.html          # The web app
│       ├── static/             # app.js, app.css, about.html, fonts
│       ├── role_presets.json   # Role templates
│       ├── resume_examples.json
│       └── test_app.py         # Automated tests
├── examples/resumes/           # Fictitious sample resume PDFs
├── docs/                       # Architecture plans and presentations
├── .env.example                # Template for your settings
├── START_SMARTHIRE.cmd         # Windows launcher
└── start_smarthire.sh          # macOS / Linux launcher
```

---

## Tech stack

| Area | Technology |
|---|---|
| Backend | Python, Flask, SQLite |
| Frontend | HTML, CSS and JavaScript (no framework), browser camera and microphone APIs |
| AI | Groq API (`openai/gpt-oss-20b`) for interview rating and skill extraction |
| Speech | faster-whisper (Whisper base) for speech-to-text; Windows System.Speech to read questions aloud |
| Identity check | OpenCV SFace face recognition, MediaPipe Face Landmarker |
| Documents | PyPDF2 (reading PDFs), ReportLab (PDF reports), PyAV and NumPy (audio and image data) |

---

## Data and privacy

- Roles, resumes, answers and scores are stored in `app/unified/smarthire.sqlite3` on your computer. This file is excluded from Git; keep it private.
- Speech transcription, the identity check and coding tests run on your computer. Camera frames and face data are never saved.
- Only two optional features send data out, both to Groq and only when a key is set: **Rate with AI** sends the interview questions and answers, and **AI skill extraction** sends the text of the PDF you attach.

---

## Running the tests

```powershell
cd app
python -m unittest unified.test_app -v
```

---

## Limitations

- This is a local tool for one recruiter's computer. There are no logins or user accounts yet.
- The coding test runs submitted code directly on the computer. Only use it with code you trust.
- The identity check shows a similarity score, not a calibrated identity probability, and it can be fooled. Keep a human in the loop.
- Scores support a recruiter's judgment. They are not automatic hiring decisions.
