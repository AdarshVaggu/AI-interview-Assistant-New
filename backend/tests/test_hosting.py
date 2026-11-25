"""Verify combined hosting without real API keys or AI requests.

Build frontend/dist first, then run from the project root:
python -m unittest discover -s backend/tests -v
"""
import importlib
import os
from pathlib import Path
import unittest
from unittest.mock import patch


class HostingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.environment = patch.dict(os.environ, {
            "GOOGLE_API_KEY": "test-not-a-real-key",
            "ASSEMBLYAI_API_KEY": "test-not-a-real-key",
            "MURF_API_KEY": "test-not-a-real-key",
        })
        cls.environment.start()
        cls.addClassCleanup(cls.environment.stop)
        # Unexpected external calls must fail rather than use provider accounts.
        cls.network = patch("socket.socket.connect", side_effect=AssertionError("Network disabled in hosting tests"))
        cls.network.start()
        cls.addClassCleanup(cls.network.stop)
        cls.app = importlib.import_module("backend.app").app
        cls.client = cls.app.test_client()

    def test_health_is_local(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"status": "ok"})

    def test_frontend_and_compiled_assets_are_served(self):
        index = Path(self.app.static_folder) / "index.html"
        self.assertTrue(index.exists(), "Build the frontend before running hosting tests")
        with self.client.get("/") as response:
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'<div id="root"></div>', response.data)
        for asset in (index.parent / "assets").iterdir():
            with self.subTest(asset=asset.name):
                with self.client.get(f"/assets/{asset.name}") as response:
                    self.assertEqual(response.status_code, 200)

    def test_api_aliases_match_the_existing_handlers(self):
        routes = {rule.rule: rule for rule in self.app.url_map.iter_rules()}
        for path in ("start-interview", "submit-answer", "get-feedback"):
            with self.subTest(path=path):
                self.assertEqual(routes[f"/api/{path}"].endpoint, routes[f"/{path}"].endpoint)
                self.assertIn("POST", routes[f"/api/{path}"].methods)

    def test_server_files_are_not_exposed_by_static_hosting(self):
        for path in ("/backend/app.py", "/.env", "/requirements.txt"):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)


if __name__ == "__main__":
    unittest.main()
