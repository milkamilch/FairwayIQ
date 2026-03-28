import os
import tempfile
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from analyzer import analyze_video
from feedback import generate_feedback

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("swing-ml")

WEBHOOK_SECRET = os.getenv("ML_WEBHOOK_SECRET", "changeme")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("FairwayIQ Swing ML Service starting")
    yield
    log.info("FairwayIQ Swing ML Service stopped")


app = FastAPI(title="FairwayIQ Swing ML", lifespan=lifespan)


class AnalyzeRequest(BaseModel):
    swingId:     str
    videoUrl:    str
    callbackUrl: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Download video from R2, run pose analysis, and POST results back to the
    backend callback URL. Returns immediately with {"accepted": true} so the
    backend doesn't block on the HTTP call.
    """
    log.info(f"Analyzing swing {req.swingId}")

    # Download video to temp file
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.get(req.videoUrl)
            r.raise_for_status()
            video_bytes = r.content
    except Exception as e:
        log.error(f"Failed to download video: {e}")
        await _post_failure(req.callbackUrl, req.swingId)
        raise HTTPException(status_code=502, detail="Could not download video")

    suffix = ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    try:
        phases, metrics = analyze_video(tmp_path)
    except Exception as e:
        log.error(f"Analysis failed: {e}")
        await _post_failure(req.callbackUrl, req.swingId)
        return JSONResponse({"accepted": True, "error": str(e)})
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    feedback_items, overall_score = generate_feedback(metrics)

    payload = {
        "secret":       WEBHOOK_SECRET,
        "swingId":      req.swingId,
        "overallScore": overall_score,
        "phases": {
            "address":       phases.address,
            "backswingMid":  phases.backswing_mid,
            "top":           phases.top,
            "downswingMid":  phases.downswing_mid,
            "impact":        phases.impact,
            "follow":        phases.follow,
        },
        "metrics": {
            "shoulderRotation": metrics.shoulder_rotation,
            "hipRotation":      metrics.hip_rotation,
            "xFactor":          metrics.x_factor,
            "spineConsistency": metrics.spine_consistency,
            "kneeFlexAddress":  metrics.knee_flex_address,
            "overswing":        metrics.overswing,
            "balanceFinish":    metrics.balance_finish,
        },
        "feedback": [
            {
                "category": f.category,
                "type":     f.type,
                "message":  f.message,
                "metric":   f.metric,
                "actual":   f.actual,
                "target":   f.target,
            }
            for f in feedback_items
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            cb = await client.post(req.callbackUrl, json=payload)
            cb.raise_for_status()
            log.info(f"Callback success for swing {req.swingId}")
    except Exception as e:
        log.error(f"Callback failed for swing {req.swingId}: {e}")

    return {"accepted": True}


async def _post_failure(callback_url: str, swing_id: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(callback_url, json={
                "secret":  WEBHOOK_SECRET,
                "swingId": swing_id,
                "failed":  True,
            })
    except Exception:
        pass
