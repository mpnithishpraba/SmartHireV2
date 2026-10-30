"""Download the optional local models SmartHire uses for speech-to-text and the identity check.

Run once after installing requirements:  python download_models.py
Files that are already present are skipped, so it is safe to run again.
"""
from __future__ import annotations

import argparse
import os
import sys
import urllib.request
from pathlib import Path

FACE_MODELS = {
    "face_recognition_sface_2021dec.onnx":
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
    "face_landmarker.task":
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
}
WHISPER_REPO = "Systran/faster-whisper-base"


def download(url, target):
    partial = target.with_suffix(target.suffix + ".part")
    with urllib.request.urlopen(url, timeout=60) as response, open(partial, "wb") as out:
        total = int(response.headers.get("Content-Length") or 0)
        done = 0
        while chunk := response.read(1 << 20):
            out.write(chunk)
            done += len(chunk)
            if total:
                print(f"\r  {target.name}: {done * 100 // total}% of {total / 1e6:.0f} MB", end="", flush=True)
    partial.replace(target)
    print()


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--models-dir", type=Path, default=Path(__file__).resolve().parent / "models",
                        help="where to put the models (default: app/models)")
    parser.add_argument("--skip-face", action="store_true", help="do not download the identity-check models")
    parser.add_argument("--skip-whisper", action="store_true", help="do not download the speech-to-text model")
    args = parser.parse_args()

    if not args.skip_face:
        face_dir = args.models_dir / "face"
        face_dir.mkdir(parents=True, exist_ok=True)
        print("Identity-check models (OpenCV SFace + MediaPipe Face Landmarker)")
        for name, url in FACE_MODELS.items():
            target = face_dir / name
            if target.exists() and target.stat().st_size:
                print(f"  {name}: already present")
            else:
                download(url, target)

    if not args.skip_whisper:
        print(f"Speech-to-text model ({WHISPER_REPO}, about 145 MB)")
        snapshots = args.models_dir / f"models--{WHISPER_REPO.replace('/', '--')}" / "snapshots"
        if any((path / "model.bin").exists() for path in snapshots.glob("*")):
            print("  already present")
        else:
            os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")  # Windows copies files instead; harmless
            from huggingface_hub import snapshot_download  # installed with faster-whisper
            snapshot_download(WHISPER_REPO, cache_dir=str(args.models_dir))
            print("  done")

    print(f"Models are ready in {args.models_dir}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        sys.exit(f"Model download failed: {exc}\nCheck your internet connection and run the script again.")
