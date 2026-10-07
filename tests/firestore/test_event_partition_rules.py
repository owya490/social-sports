import base64
import json
import os
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen


class EventPartitionRulesTest(unittest.TestCase):
    PROJECT = "demo-event-rule-security"
    PARTITIONS = ["Active/Public", "Active/Private", "InActive/Public", "InActive/Private"]

    @classmethod
    def setUpClass(cls):
        host = os.environ.get("FIRESTORE_EMULATOR_HOST")
        if not host:
            raise unittest.SkipTest("Firestore emulator is required")
        if host != "127.0.0.1:8186":
            raise RuntimeError("Rules tests require the isolated local emulator on port 8186")
        cls.base = f"http://{host}/v1/projects/{cls.PROJECT}/databases/(default)/documents"

    def setUp(self):
        host = os.environ["FIRESTORE_EMULATOR_HOST"]
        self.assertEqual(self.request("DELETE", f"http://{host}/emulator/v1/projects/{self.PROJECT}/databases/(default)/documents")[0], 200)

    def token(self, uid):
        def encode(value):
            return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")
        return ".".join([encode({"alg": "none", "typ": "JWT"}), encode({
            "sub": uid, "user_id": uid, "aud": self.PROJECT,
            "iss": f"https://securetoken.google.com/{self.PROJECT}",
            "iat": int(time.time()), "exp": int(time.time()) + 3600,
            "firebase": {"sign_in_provider": "password"},
        }), ""])

    def request(self, method, url, body=None, uid="admin"):
        headers = {"Content-Type": "application/json"}
        if uid is not None:
            headers["Authorization"] = "Bearer " + ("owner" if uid == "admin" else self.token(uid))
        request = Request(url, data=None if body is None else json.dumps(body).encode(), method=method, headers=headers)
        try:
            with urlopen(request, timeout=10) as response:
                payload = response.read()
                return response.status, json.loads(payload) if payload else {}
        except HTTPError as error:
            with error:
                return error.code, json.loads(error.read())

    def event(self, partition, owner="owner-1"):
        return {"fields": {
            "organiserId": {"stringValue": owner},
            "isActive": {"booleanValue": partition.startswith("Active/")},
            "isPrivate": {"booleanValue": partition.endswith("Private")},
            "name": {"stringValue": "Original"},
        }}

    def put(self, partition, uid, owner="owner-1", event_id="event-1"):
        return self.request("PATCH", f"{self.base}/Events/{partition}/{event_id}", self.event(partition, owner), uid)

    def test_organiser_can_create_fresh_active_events_but_not_impersonate_another_owner(self):
        for partition in self.PARTITIONS[:2]:
            with self.subTest(partition=partition):
                self.assertEqual(self.put(partition, "owner-1", event_id=partition.split("/")[1])[0], 200)
        self.assertEqual(self.put("Active/Public", "attacker", "owner-1", "forged-owner")[0], 403)
        self.assertEqual(self.put("Active/Public", None, event_id="anonymous")[0], 403)

    def test_clients_cannot_create_inactive_or_unknown_partition_documents(self):
        for partition in self.PARTITIONS[2:] + ["Other/Public", "Active/Other"]:
            with self.subTest(partition=partition):
                self.assertEqual(self.put(partition, "owner-1")[0], 403)
                self.assertEqual(self.request("GET", f"{self.base}/Events/{partition}/event-1")[0], 404)

    def test_creation_flags_must_match_the_active_partition(self):
        for field in ["isActive", "isPrivate"]:
            with self.subTest(field=field):
                payload = self.event("Active/Public")
                payload["fields"][field]["booleanValue"] = field == "isPrivate"
                self.assertEqual(self.request(
                    "PATCH", f"{self.base}/Events/Active/Public/{field}",
                    payload, "owner-1",
                )[0], 403)

    def test_existing_event_in_any_partition_blocks_a_forged_active_duplicate(self):
        for existing in self.PARTITIONS:
            with self.subTest(existing=existing):
                event_id = existing.replace("/", "-")
                self.assertEqual(self.put(existing, "admin", "victim", event_id)[0], 200)
                target = "Active/Private" if existing == "Active/Public" else "Active/Public"
                self.assertEqual(self.put(target, "attacker", "attacker", event_id)[0], 403)
                self.assertEqual(self.request("GET", f"{self.base}/Events/{target}/{event_id}")[0], 404)

    def test_deleted_event_ids_stay_reserved_including_within_a_batch(self):
        self.assertEqual(self.request(
            "PATCH", f"{self.base}/DeletedEvents/event-1",
            self.event("Active/Public", "victim"),
        )[0], 200)
        self.assertEqual(self.put("Active/Public", "attacker", "attacker")[0], 403)
        writes = [{"update": {
            "name": f"projects/{self.PROJECT}/databases/(default)/documents/{path}/batched-event",
            **self.event("Active/Public"),
        }} for path in ["DeletedEvents", "Events/Active/Public"]]
        self.assertEqual(self.request("POST", f"{self.base}:commit", {"writes": writes}, "owner-1")[0], 403)
        for path in ["DeletedEvents", "Events/Active/Public"]:
            self.assertEqual(self.request("GET", f"{self.base}/{path}/batched-event")[0], 404)

    def test_batch_cannot_create_the_same_id_in_both_active_partitions(self):
        writes = [{"update": {
            "name": f"projects/{self.PROJECT}/databases/(default)/documents/Events/{partition}/event-1",
            **self.event(partition),
        }} for partition in self.PARTITIONS[:2]]
        self.assertEqual(self.request("POST", f"{self.base}:commit", {"writes": writes}, "owner-1")[0], 403)
        for partition in self.PARTITIONS[:2]:
            self.assertEqual(self.request("GET", f"{self.base}/Events/{partition}/event-1")[0], 404)

    def test_normal_owner_edits_and_public_access_count_updates_still_work(self):
        self.assertEqual(self.put("Active/Public", "owner-1")[0], 200)
        url = f"{self.base}/Events/Active/Public/event-1"
        self.assertEqual(self.request("PATCH", url + "?updateMask.fieldPaths=name", {"fields": {"name": {"stringValue": "Updated"}}}, "owner-1")[0], 200)
        self.assertEqual(self.request("PATCH", url + "?updateMask.fieldPaths=organiserId", {"fields": {"organiserId": {"stringValue": "victim"}}}, "owner-1")[0], 403)
        self.assertEqual(self.request("PATCH", url + "?updateMask.fieldPaths=name", {"fields": {"name": {"stringValue": "Forged"}}}, "attacker")[0], 403)
        self.assertEqual(self.request("PATCH", url + "?updateMask.fieldPaths=accessCount", {"fields": {"accessCount": {"integerValue": "1"}}}, None)[0], 200)
        self.assertEqual(self.request("DELETE", url, uid="attacker")[0], 403)
        self.assertEqual(self.request("DELETE", url, uid="owner-1")[0], 200)

    def test_admin_can_archive_and_clients_cannot_replace_an_archived_event(self):
        self.assertEqual(self.put("Active/Public", "owner-1")[0], 200)
        writes = [{"update": {
            "name": f"projects/{self.PROJECT}/databases/(default)/documents/Events/InActive/Public/event-1",
            **self.event("InActive/Public"),
        }}, {"delete": f"projects/{self.PROJECT}/databases/(default)/documents/Events/Active/Public/event-1"}]
        self.assertEqual(self.request("POST", f"{self.base}:commit", {"writes": writes})[0], 200)
        self.assertEqual(self.request("GET", f"{self.base}/Events/Active/Public/event-1")[0], 404)
        self.assertEqual(self.put("Active/Public", "owner-1")[0], 403)

    def test_delete_and_recreate_in_one_batch_cannot_reuse_an_archived_id(self):
        self.assertEqual(self.put("InActive/Public", "admin")[0], 200)
        writes = [{"delete": f"projects/{self.PROJECT}/databases/(default)/documents/Events/InActive/Public/event-1"}, {"update": {
            "name": f"projects/{self.PROJECT}/databases/(default)/documents/Events/Active/Public/event-1",
            **self.event("Active/Public"),
        }}]
        self.assertEqual(self.request("POST", f"{self.base}:commit", {"writes": writes}, "owner-1")[0], 403)
        self.assertEqual(self.request("GET", f"{self.base}/Events/InActive/Public/event-1")[0], 200)
        self.assertEqual(self.request("GET", f"{self.base}/Events/Active/Public/event-1")[0], 404)


if __name__ == "__main__":
    unittest.main()
