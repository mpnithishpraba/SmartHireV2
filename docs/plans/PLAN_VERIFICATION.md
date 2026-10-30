# SmartHire plan verification — 7 October 2026

## Verdict

The revised [product architecture](PRODUCT_ARCHITECTURE_PLAN.md) can be designed for an India-first, offline on-premises release with no mandatory paid API or software subscription. It is **not yet verified as a shippable product**. The Python demo runs locally with one `.cmd` launcher, but it still requires an installed Python environment and does not implement the planned conversational local LLM interview, production face verification, or secure public code runner.

“Fully free” means no required software usage fee, cloud service, or paid API. Hardware, electricity, and an existing Windows licence are outside that claim. A Linux distribution can avoid a paid operating-system licence. Commercial redistribution of each model, voice, font, animation, and binary must be checked before the free-product claim is made.

## Findings and corrections made to the plan

| Check | Finding | Correction / gate |
|---|---|---|
| Windows startup | Prior plan described a Linux appliance but not the requested `.cmd`/`.exe` path. | Added Windows first-run wizard and one-folder `SmartHire.exe`/`START_SMARTHIRE.cmd` supervisor design. Subsequent starts are one click or one command. |
| Offline browser media | Camera/mic on another LAN device need a secure browser context; `localhost` works only on the same machine. | Added localhost workstation mode and an internal HTTPS certificate/trust step for LAN mode. [Browser secure-context requirement](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). |
| Offline WebRTC | A default public STUN/TURN server would violate offline operation. | Restricted ICE to local/private configuration and packaged internal TURN only where needed. |
| Coding safety | The current `subprocess` runner is not a security sandbox. | Windows production runner now requires AppContainer isolation plus Job Object limits and adversarial escape testing; Linux uses a separate isolated runner. [Microsoft AppContainer](https://learn.microsoft.com/en-us/windows/win32/secauthz/appcontainer-isolation), [Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects). |
| Model and asset cost | Free inference runtimes do not prove that bundled LLM weights, TTS voices, face models, or motion assets are free to redistribute commercially. | Added a versioned software/model bill of materials and licence gate. No model or voice is selected for shipment until its rights are verified. |
| Windows packaging | A single self-extracting `.exe` containing large models can have slow startup and awkward updates. | Planned a one-folder installation with a small launcher. PyInstaller permits commercial bundling subject to dependency licences. [PyInstaller licence](https://pyinstaller.org/en/stable/license.html). |
| Signing cost | Requiring a commercial Windows signing certificate would conflict with a strict zero-fee stack. | Planned self-managed offline release signatures for integrity. Native Authenticode signing remains optional; customer IT may need to trust an internal certificate. |
| Remote candidates | Air-gapped access and public-internet interviews cannot both be guaranteed. | First release explicitly supports local network or assessment-station candidates. Remote VPN/gateway mode needs a separate design review. |

## What was actually checked in the current repository

- `START_SMARTHIRE.cmd` launched the existing demo successfully on this Windows machine; `http://127.0.0.1:5000/api/state` returned HTTP 200.
- Eight local workflow checks now pass, covering the shared candidate record, all three current phases, PDF output, all three difficulty levels including advanced coding, example PDFs, face-check consent and automatic result shape, and spoken-question fallback.
- The unified app and web UI contain no external URL/API/CDN references in the checked source files. The local Whisper model file is present and was loaded in the previous implementation check.
- The present `.cmd` checks for installed packages and explains the one-time dependency step. It is **not** a clean-machine offline installer; a clean air-gapped PC still needs prepackaged Python, wheels, and model files.
- The UI now includes consistent Beginner / Intermediate / Advanced controls, role templates, example resumes, motion graphics, an optional Windows voice endpoint, and an in-memory 1:1 face check with a live box overlay. It returns match, no match, or inconclusive automatically. The SFace and MediaPipe models loaded locally; a repeated still image returned inconclusive because it lacked motion. The displayed percent is raw cosine similarity, not calibrated confidence or identity probability. This is not validated liveness or production identity proofing. [OpenCV's example threshold](https://docs.opencv.org/4.12.0/d0/dd4/tutorial_dnn_face.html) is only a starting point for this demo.
- The active app is isolated in `app/`, examples in `examples/`, prior project in `archive/`, and planning material in `docs/`. `START_SMARTHIRE.cmd` launches from the new path; the current database was copied to `app/unified/` and the archived snapshot remains private.
- This development machine reports `torch.cuda.is_available() == False`, so the intended NVIDIA GPU path cannot be measured here. Windows SAPI lists voices but cannot synthesize under the current host security setting; the UI falls back to written questions.

## Release-blocking proof still required

1. Build the Windows offline installer and launcher. Test it on a clean Windows 11 machine with network interfaces disabled, without preinstalled Python or development tools.
2. Freeze and audit every dependency and model/voice/asset licence, create the bill of materials, bundle exact files, and test installation with no downloads, account, licence server, or telemetry.
3. Build and test the live local STT/LLM/TTS/media path on the selected Windows NVIDIA GPU target and approved face verification/PAD path. Bundle a reliable offline voice model; measure latency and concurrency. The current bank-driven interview, Windows voice attempt, and simple face motion check do not close this gate.
4. Build the production code sandbox; prove it cannot read HR data, reach the network, escape its filesystem, or exhaust the host under hostile submissions.
5. Test same-PC `localhost` and LAN HTTPS modes separately, including microphone/camera permissions and certificate trust on candidate devices.
6. Complete privacy, security, accessibility, fairness, backup/restore, restart recovery, and HR pilot gates from the architecture plan.

The architecture is now internally consistent with a simple Windows launch and an offline, zero-subscription target. Completion of these gates is what would justify calling the shipped product fully offline and free of mandatory software fees.
