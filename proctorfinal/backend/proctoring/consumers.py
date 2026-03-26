import json, logging, asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

class ProctorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.exam_id   = self.scope["url_route"]["kwargs"]["exam_id"]
        self.room      = f"proctor_{self.exam_id}"
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()
        await self.send(json.dumps({"type":"connected","exam_id":self.exam_id}))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or "{}")
        except Exception:
            return
        if data.get("type") == "video_frame":
            await self._process_frame(data)

    async def _process_frame(self, data):
        try:
            import base64, numpy as np, cv2
            from .ai_engine import decode_b64, analyse_frame
            frame = decode_b64(data.get("data",""))
            if frame is None:
                return
            result = await asyncio.get_event_loop().run_in_executor(None, analyse_frame, frame)
            analysis = {
                "type":             "frame_analysis",
                "face_count":       result.face_count,
                "looking_away":     result.looking_away,
                "eyes_closed":      result.eyes_closed,
                "objects_detected": result.objects_detected,
                "ms":               result.ms,
            }
            await self.send(json.dumps(analysis))
            for v in result.violations:
                await self._save_violation(data.get("attempt_id"), v)
        except Exception as e:
            logger.error("Frame processing error: %s", e)

    @database_sync_to_async
    def _save_violation(self, attempt_id, violation):
        try:
            from violations.services import record_violation
            from exams.models import Exam, Attempt
            exam    = Exam.objects.get(pk=self.exam_id)
            user    = self.scope["user"]
            attempt = Attempt.objects.get(pk=attempt_id) if attempt_id else None
            v, count, action = record_violation(user, exam, violation["type"], attempt)
            import asyncio
            asyncio.ensure_future(self.send_violation_alert(v, count, action))
        except Exception as e:
            logger.error("Violation save error: %s", e)

    async def send_violation_alert(self, v, count, action):
        await self.send(json.dumps({
            "type":           "violation_alert",
            "violation_type": v.type,
            "severity":       v.severity,
            "count":          count,
            "action":         action or "",
            "message":        self._msg(v.type, count, action),
        }))

    def _msg(self, vtype, count, action):
        msgs = {
            "no_face":       "No face detected. Please stay in front of camera.",
            "multiple_faces":"Multiple faces detected. Only you should be visible.",
            "looking_away":  "Please keep your eyes on the screen.",
            "phone_detected":"Mobile phone detected! Remove it immediately.",
            "tab_switch":    "Tab switch detected.",
        }
        base = msgs.get(vtype, f"Violation detected: {vtype.replace('_',' ')}")
        if action == "auto_submit":   return f"{base} Exam auto-submitted ({count} violations)."
        if action == "mark_suspicious": return f"{base} Exam flagged as suspicious ({count} violations)."
        if action == "show_warning":  return f"{base} Warning: {count} violation(s) recorded."
        return base
