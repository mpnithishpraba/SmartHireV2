"""Volatile, local 1:1 face comparison for a supervised demonstration.

This is not a calibrated production identity or presentation-attack detector.
No image, embedding, or result is written to disk by this module.
"""
from __future__ import annotations

import threading
from pathlib import Path


MODEL_DIR = Path(__file__).resolve().parents[1] / "models" / "face"
_engine = None
_lock = threading.Lock()
_inference_lock = threading.Lock()
references = {}
results = {}


class FaceError(ValueError):
    pass


class FaceEngine:
    def __init__(self):
        import cv2
        import mediapipe as mp
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision

        self.cv2 = cv2
        self.mp = mp
        model = MODEL_DIR / "face_recognition_sface_2021dec.onnx"
        landmarks = MODEL_DIR / "face_landmarker.task"
        if not model.is_file() or not landmarks.is_file():
            raise FaceError("Bundled face models are missing. Face check is unavailable offline.")
        self.recognizer = cv2.FaceRecognizerSF_create(str(model), "")
        options = vision.FaceLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(landmarks)),
            running_mode=vision.RunningMode.IMAGE, num_faces=2,
            min_face_detection_confidence=0.5, min_face_presence_confidence=0.5)
        self.landmarker = vision.FaceLandmarker.create_from_options(options)

    def inspect(self, image_bytes):
        import numpy as np

        if not image_bytes or len(image_bytes) > 2_000_000:
            raise FaceError("Provide an image smaller than 2 MB.")
        image = self.cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), self.cv2.IMREAD_COLOR)
        if image is None:
            raise FaceError("Could not decode the face image.")
        height, width = image.shape[:2]
        if min(height, width) < 160 or max(height, width) > 1920:
            raise FaceError("Use an image between 160 and 1920 pixels per side.")
        rgb = self.cv2.cvtColor(image, self.cv2.COLOR_BGR2RGB)
        detection = self.landmarker.detect(self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=rgb))
        if len(detection.face_landmarks) != 1:
            raise FaceError("Show exactly one clear face in the frame.")
        points = detection.face_landmarks[0]
        coords = [(points[i].x * width, points[i].y * height) for i in (33, 263, 1, 61, 291)]
        xs, ys = [p[0] for p in coords], [p[1] for p in coords]
        left, top = max(0, min(xs)-20), max(0, min(ys)-20)
        aligned = np.array([left, top, min(width-left, max(xs)-min(xs)+40),
            min(height-top, max(ys)-min(ys)+40), *[axis for point in coords for axis in point], 1.0], dtype=np.float32)
        try:
            feature = self.recognizer.feature(self.recognizer.alignCrop(image, aligned))
        except Exception as exc:
            raise FaceError("Face alignment failed. Try better lighting and face the camera.") from exc
        all_x = [point.x for point in points]
        all_y = [point.y for point in points]
        padding = 0.035
        x1, y1 = max(0.0, min(all_x)-padding), max(0.0, min(all_y)-padding)
        x2, y2 = min(1.0, max(all_x)+padding), min(1.0, max(all_y)+padding)
        box = {"x": round(x1, 4), "y": round(y1, 4), "width": round(x2-x1, 4), "height": round(y2-y1, 4)}
        return feature, points[1].x, box

    def similarity(self, reference, probe):
        return float(self.recognizer.match(reference, probe, self.cv2.FaceRecognizerSF_FR_COSINE))


def engine():
    global _engine
    with _lock:
        if _engine is None:
            _engine = FaceEngine()
        return _engine


def enroll(candidate_id, image_bytes):
    with _inference_lock:
        feature, _, _ = engine().inspect(image_bytes)
    references[candidate_id] = feature
    results.pop(candidate_id, None)


def verify(candidate_id, images):
    if candidate_id not in references:
        raise FaceError("A recruiter must add a reference photo during this app session first.")
    if len(images) != 3:
        raise FaceError("Capture three webcam frames while moving gently side to side.")
    with _inference_lock:
        checks = [engine().inspect(image) for image in images]
        motion = max(point for _, point, _ in checks) - min(point for _, point, _ in checks)
        scores = [engine().similarity(references[candidate_id], feature) for feature, _, _ in checks]
    # OpenCV's published SFace example uses 0.363 as a starting cosine threshold.
    # This installation has not undergone demographic or presentation-attack validation.
    minimum = min(scores)
    status = "inconclusive"
    if motion >= 0.04:
        status = "match" if minimum >= 0.363 else "no_match"
    result = {"status": status, "similarity": round(minimum, 3),
              "match_score": round(max(0, min(100, minimum * 100)), 1),
              "score_label": "uncalibrated cosine similarity; not a probability of identity",
              "motion_detected": motion >= 0.04, "box": checks[-1][2],
              "note": "Automated demo comparison. Motion alone does not prevent photo or video replay attacks."}
    results[candidate_id] = result
    return result


def preview(candidate_id, image_bytes):
    if candidate_id not in references:
        raise FaceError("Add a consented reference photo before starting the camera check.")
    with _inference_lock:
        feature, _, box = engine().inspect(image_bytes)
        similarity = engine().similarity(references[candidate_id], feature)
    return {"box": box, "match_score": round(max(0, min(100, similarity * 100)), 1),
            "score_label": "uncalibrated cosine similarity; not a probability of identity"}
