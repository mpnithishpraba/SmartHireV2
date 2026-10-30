"""End-to-end checks for the local demo workflow."""
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from unified import app as module


class LocalWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.db_patch = patch.object(module, "DB_PATH", Path(self.directory.name) / "test.sqlite3")
        self.db_patch.start()
        module.init_db()
        self.client = module.app.test_client()

    def tearDown(self):
        self.db_patch.stop()
        self.directory.cleanup()

    def test_all_phases_share_candidate_and_report(self):
        job = self.client.post("/api/jobs", json={
            "title": "Python Engineer", "role": "swe", "required_skills": "Python, SQL",
            "preferred_skills": "Docker", "min_experience": 2, "education": "B.Tech",
            "certificates": "AWS Certified Developer", "work_mode": "onsite",
            "location": "Bengaluru", "shift": "night", "shift_required": True,
        })
        self.assertEqual(job.status_code, 201)
        job_id = job.json["id"]
        candidate = self.client.post("/api/candidates", data={
            "job_id": job_id, "name": "Asha Rao", "location": "Bengaluru",
            "shifts": "night", "resume_text": "Asha Rao\nB.Tech\n3 years of experience\nPython SQL Docker\nAWS Certified Developer",
        })
        self.assertEqual(candidate.status_code, 201)
        candidate_id = candidate.json["id"]
        self.assertEqual(candidate.json["phase1"]["score"], 100)

        test = self.client.post(f"/api/candidates/{candidate_id}/aptitude/start", json={})
        self.assertEqual(test.status_code, 200)
        self.assertEqual(len(test.json["questions"]), 12)
        grade = self.client.post(f"/api/candidates/{candidate_id}/aptitude/submit", json={"answers": {}})
        self.assertEqual(grade.json["stages"]["aptitude"]["score"], 0)

        problem = self.client.get(f"/api/candidates/{candidate_id}/coding/problem")
        self.assertEqual(problem.status_code, 200)
        code = "import ast,sys\na=ast.literal_eval(sys.stdin.readline())\nt=int(sys.stdin.readline())\nfor i in range(len(a)):\n for j in range(i+1,len(a)):\n  if a[i]+a[j]==t: print([i,j]);raise SystemExit"
        coding = self.client.post(f"/api/candidates/{candidate_id}/coding/submit", json={"source_code": code})
        self.assertEqual(coding.status_code, 200)
        self.assertEqual(coding.json["stages"]["coding"]["score"], 100)

        start = self.client.post(f"/api/candidates/{candidate_id}/interview/start", json={})
        self.assertEqual(start.status_code, 200)
        response = start.json
        for _ in range(response["total"]):
            response = self.client.post(f"/api/candidates/{candidate_id}/interview/answer",
                                        json={"answer": "I worked with my team to solve the problem, tested the result, and shared the outcome with stakeholders."}).json
        self.assertTrue(response["done"])
        self.assertIsNone(response["candidate"]["stages"]["interview"]["score"])
        self.assertFalse(response["candidate"]["overall"]["complete"])
        review = self.client.post(f"/api/candidates/{candidate_id}/interview/review", json={"ratings": [3, 3, 2, 3]})
        self.assertEqual(review.status_code, 200)
        self.assertEqual(review.json["stages"]["interview"]["score"], 68.75)
        self.assertTrue(review.json["overall"]["complete"])
        analysis = self.client.get(f"/api/candidates/{candidate_id}/analysis")
        self.assertEqual(analysis.status_code, 200)
        self.assertEqual(len(analysis.json["summary"]), 5)
        self.assertEqual([part["weight"] for part in analysis.json["phases"]], [30, 20, 25, 25])
        self.assertEqual([part["contribution"] for part in analysis.json["phases"][:3]], [30, 0, 25])
        self.assertEqual(len(analysis.json["interview_answers"]), 4)
        self.assertAlmostEqual(sum(part["contribution"] for part in analysis.json["phases"]),
                               analysis.json["overall"]["score"], delta=0.02)
        self.assertEqual(self.client.get(f"/api/candidates/{candidate_id}/report.pdf").status_code, 200)
        state = self.client.get("/api/state").json
        self.assertEqual(state["candidates"][0]["id"], candidate_id)
        self.assertNotIn("text", state["candidates"][0]["resume"])

    def test_missing_shift_needs_confirmation(self):
        job = self.client.post("/api/jobs", json={"title": "Night operator", "shift": "night", "shift_required": True}).json
        candidate = self.client.post("/api/candidates", data={"job_id": job["id"], "resume_text": "Candidate\nPython"}).json
        self.assertIn("Shift availability needs confirmation", candidate["phase1"]["review"])
        self.assertIsNone(candidate["overall"]["score"])
        analysis = self.client.get(f"/api/candidates/{candidate['id']}/analysis").json
        self.assertEqual(len(analysis["summary"]), 5)
        self.assertIsNone(analysis["phases"][1]["contribution"])

    def test_transcription_requires_recording(self):
        response = self.client.post("/api/transcribe", data={})
        self.assertEqual(response.status_code, 400)

    def test_irrelevant_long_answers_do_not_receive_automatic_scores(self):
        job = self.client.post("/api/jobs", json={"title": "Engineer", "role": "swe"}).json
        candidate = self.client.post("/api/candidates", data={"job_id": job["id"], "resume_text": "Engineer\nPython"}).json
        cid = candidate["id"]
        started = self.client.post(f"/api/candidates/{cid}/interview/start", json={}).json
        for _ in range(started["total"]):
            result = self.client.post(f"/api/candidates/{cid}/interview/answer", json={
                "answer": "REST means taking a nap, and the bug was a centipede in my socks. " * 6}).json
        self.assertTrue(result["done"])
        self.assertIsNone(result["candidate"]["stages"]["interview"]["score"])
        self.assertTrue(all(answer["score"] is None for answer in result["candidate"]["stages"]["interview"]["answers"]))
        self.assertEqual(self.client.post(f"/api/candidates/{cid}/interview/review", json={"ratings": [0]}).status_code, 400)

    def test_legacy_heuristic_scores_are_preserved_but_withdrawn(self):
        job = self.client.post("/api/jobs", json={"title": "Engineer"}).json
        candidate = self.client.post("/api/candidates", data={"job_id": job["id"], "resume_text": "Engineer\nPython"}).json
        stored = module.get("candidates", candidate["id"])
        stored["stages"]["interview"] = {"score": 90, "answers": [{"question": "Example?", "answer": "Unrelated answer", "score": 90}],
                                         "method": "Offline text evaluation"}
        module.update_overall(stored)
        module.save("candidates", stored)
        module.init_db()
        migrated = module.get("candidates", candidate["id"])
        stage = migrated["stages"]["interview"]
        self.assertIsNone(stage["score"])
        self.assertEqual(stage["legacy_heuristic_score"], 90)
        self.assertIsNone(stage["answers"][0]["score"])
        self.assertEqual(stage["answers"][0]["legacy_heuristic_score"], 90)
        self.assertIsNone(migrated["overall"]["score"])

    def test_difficulty_selects_available_question_banks(self):
        job = self.client.post("/api/jobs", json={"title": "Advanced engineer", "role": "swe",
            "difficulty": {"aptitude": 3, "coding": 2, "interview": 3}})
        self.assertEqual(job.status_code, 201)
        candidate = self.client.post("/api/candidates", data={"job_id": job.json["id"], "resume_text": "Engineer\nPython"}).json
        candidate_id = candidate["id"]
        aptitude = self.client.post(f"/api/candidates/{candidate_id}/aptitude/start", json={}).json
        self.assertEqual(aptitude["difficulty"], "hard")
        hard_ids = {q["id"] for section in module.QUESTION_BANK.values() for q in section["hard"]}
        self.assertTrue(all(q["id"] in hard_ids for q in aptitude["questions"]))
        self.assertEqual(self.client.get(f"/api/candidates/{candidate_id}/coding/problem").json["difficulty"], "medium")
        self.assertEqual(self.client.post(f"/api/candidates/{candidate_id}/interview/start", json={}).json["total"], 5)
        advanced = self.client.post("/api/jobs", json={"title": "Advanced", "difficulty": {"aptitude": 3, "coding": 3, "interview": 3}})
        self.assertEqual(advanced.status_code, 201)
        advanced_candidate = self.client.post("/api/candidates", data={"job_id": advanced.json["id"], "resume_text": "Engineer\nPython"}).json
        advanced_id = advanced_candidate["id"]
        self.assertEqual(self.client.get(f"/api/candidates/{advanced_id}/coding/problem").json["difficulty"], "hard")
        solution = "import ast,sys,heapq\na=sys.stdin.read().splitlines(); n=int(a[0]); edges=ast.literal_eval(a[1]); source=int(a[2]); graph=[[] for _ in range(n)]\nfor u,v,w in edges: graph[u].append((v,w))\nd=[float('inf')]*n;d[source]=0;q=[(0,source)]\nwhile q:\n cost,u=heapq.heappop(q)\n if cost!=d[u]: continue\n for v,w in graph[u]:\n  if cost+w<d[v]: d[v]=cost+w;heapq.heappush(q,(d[v],v))\nprint([-1 if x==float('inf') else x for x in d])"
        grade = self.client.post(f"/api/candidates/{advanced_id}/coding/submit", json={"source_code": solution})
        self.assertEqual(grade.status_code, 200)
        self.assertEqual(grade.json["stages"]["coding"]["score"], 100)

    def test_face_check_requires_consent_and_reference(self):
        job = self.client.post("/api/jobs", json={"title": "Analyst"}).json
        candidate = self.client.post("/api/candidates", data={"job_id": job["id"], "resume_text": "Analyst\nSQL"}).json
        candidate_id = candidate["id"]
        denied = self.client.post(f"/api/candidates/{candidate_id}/face/enroll", data={"photo": (io.BytesIO(b"image"), "photo.jpg")})
        self.assertEqual(denied.status_code, 400)
        no_reference = self.client.post(f"/api/candidates/{candidate_id}/face/verify", data={})
        self.assertEqual(no_reference.status_code, 400)

    def test_face_result_is_automatic_and_has_box_and_match_score(self):
        from unified import face_verify as face
        box = {"x": .2, "y": .1, "width": .5, "height": .7}
        class StubEngine:
            position = 0
            def inspect(self, image):
                self.position += 1
                return image, (0.40, 0.47, 0.52)[(self.position - 1) % 3], box
            def similarity(self, reference, probe):
                return .72
        with patch.object(face, "engine", return_value=StubEngine()):
            face.references["sample"] = b"reference"
            result = face.verify("sample", [b"one", b"two", b"three"])
            self.assertEqual(result["status"], "match")
            self.assertEqual(result["match_score"], 72.0)
            self.assertEqual(result["box"], box)
            face.references.pop("sample", None)
            face.results.pop("sample", None)

    def test_example_resumes_are_available_as_pdf(self):
        state = self.client.get("/api/state").json
        self.assertEqual(len(state["role_presets"]), 3)
        self.assertEqual(len(state["resume_examples"]), 3)
        response = self.client.get("/api/examples/ananya_sharma.pdf")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[:4], b"%PDF")
        response.close()

    @unittest.skipUnless(module.sys.platform == "win32", "Windows SAPI voice")
    def test_current_interview_question_uses_local_voice_or_clear_fallback(self):
        job = self.client.post("/api/jobs", json={"title": "Analyst"}).json
        candidate = self.client.post("/api/candidates", data={"job_id": job["id"], "resume_text": "Analyst\nSQL"}).json
        candidate_id = candidate["id"]
        self.client.post(f"/api/candidates/{candidate_id}/interview/start", json={})
        audio = self.client.get(f"/api/candidates/{candidate_id}/interview/question.wav")
        self.assertIn(audio.status_code, (200, 503))
        if audio.status_code == 200:
            self.assertEqual(audio.data[:4], b"RIFF")
        else:
            self.assertIn("Read", audio.json["error"])


if __name__ == "__main__":
    unittest.main()
