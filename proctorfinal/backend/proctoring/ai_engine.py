import base64, logging, time
from dataclasses import dataclass, field
from typing import List, Optional
import cv2, numpy as np

logger = logging.getLogger(__name__)

_face_detection = None
_face_mesh      = None

def _init_mp():
    global _face_detection, _face_mesh
    if _face_detection is not None: return
    try:
        import mediapipe as mp
        _face_detection = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.6)
        _face_mesh      = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=4,
            refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)
        logger.info("MediaPipe loaded.")
    except Exception as e:
        logger.error("MediaPipe failed: %s", e)

_yolo = None
def _get_yolo():
    global _yolo
    if _yolo is None:
        try:
            from ultralytics import YOLO
            _yolo = YOLO("yolov8n.pt")
        except Exception as e:
            logger.error("YOLO failed: %s", e)
    return _yolo

@dataclass
class FrameResult:
    face_count:       int  = 0
    looking_away:     bool = False
    eyes_closed:      bool = False
    head_pose:        dict = field(default_factory=dict)
    objects_detected: List[str] = field(default_factory=list)
    violations:       List[dict] = field(default_factory=list)
    annotated_frame:  Optional[object] = None
    ms:               float = 0.0

_LE=[362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398]
_RE=[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
_LI=[474,475,476,477]; _RI=[469,470,471,472]

def _ear(lm,idx,w,h):
    p=[(int(lm[i].x*w),int(lm[i].y*h)) for i in idx]
    A=np.linalg.norm(np.array(p[1])-np.array(p[5]))
    B=np.linalg.norm(np.array(p[2])-np.array(p[4]))
    C=np.linalg.norm(np.array(p[0])-np.array(p[3]))
    return (A+B)/(2.0*C+1e-6)

def _eyes_closed(lm): return (_ear(lm,_LE,640,480)+_ear(lm,_RE,640,480))/2 < 0.20
def _gaze_away(lm):
    def off(ir,ey):
        cx=np.mean([lm[i].x for i in ir]); ew=abs(lm[ey[3]].x-lm[ey[0]].x)+1e-6
        return abs(cx-(lm[ey[0]].x+lm[ey[3]].x)/2)/ew
    return (off(_LI,_LE)+off(_RI,_RE))/2 > 0.35

_OBJ={67:"phone",73:"book"}
def _detect_objects(frame):
    m=_get_yolo()
    if not m: return []
    found=[]
    try:
        for box in m(frame,verbose=False)[0].boxes:
            c=int(box.cls[0])
            if c in _OBJ and float(box.conf[0])>0.45: found.append(_OBJ[c])
    except: pass
    return list(set(found))

def analyse_frame(frame) -> FrameResult:
    _init_mp()
    t0=time.perf_counter(); r=FrameResult(annotated_frame=frame.copy())
    if _face_detection is None:
        r.ms=(time.perf_counter()-t0)*1000; return r
    try:
        rgb=cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)
        fd=_face_detection.process(rgb)
        r.face_count=len(fd.detections) if fd.detections else 0
        if r.face_count>0:
            fm=_face_mesh.process(rgb)
            if fm.multi_face_landmarks:
                pl=fm.multi_face_landmarks[0]
                r.looking_away=_gaze_away(pl.landmark)
                r.eyes_closed=_eyes_closed(pl.landmark)
        r.objects_detected=_detect_objects(frame)
        if r.face_count==0: r.violations.append({"type":"no_face","severity":"low"})
        elif r.face_count>1: r.violations.append({"type":"multiple_faces","severity":"high"})
        if r.looking_away: r.violations.append({"type":"looking_away","severity":"medium"})
        if r.eyes_closed: r.violations.append({"type":"eye_closed","severity":"medium"})
        for obj in r.objects_detected:
            r.violations.append({"type":"phone_detected" if "phone" in obj else "book_detected","severity":"high"})
    except Exception as e: logger.error("Frame error: %s",e)
    r.ms=(time.perf_counter()-t0)*1000; return r

def decode_b64(b64:str):
    try:
        if "," in b64: b64=b64.split(",",1)[1]
        buf=np.frombuffer(base64.b64decode(b64),dtype=np.uint8)
        return cv2.imdecode(buf,cv2.IMREAD_COLOR)
    except: return None

def encode_b64(frame)->str:
    _,buf=cv2.imencode(".jpg",frame,[cv2.IMWRITE_JPEG_QUALITY,70])
    return "data:image/jpeg;base64,"+base64.b64encode(buf).decode()
