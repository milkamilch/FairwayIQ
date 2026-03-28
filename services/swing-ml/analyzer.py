"""
Golf Swing Analyzer using MediaPipe Pose.

Detects swing phases from video landmarks and computes biomechanical metrics:
  - shoulder_rotation   : degrees shoulder line rotated at top of backswing   (ideal ≥ 85°)
  - hip_rotation        : degrees hip line rotated at impact                   (ideal 40–50°)
  - x_factor            : shoulder_rotation - hip_rotation at top              (ideal ≥ 35°)
  - spine_consistency   : how stable the spine angle is address → impact       (ideal ≥ 80%)
  - knee_flex_address   : knee angle at address                                (ideal 15–25°)
  - overswing           : True if wrist rises past estimated parallel at top
  - balance_finish      : % frames in follow-through where COG stays centered  (ideal ≥ 75%)
"""

import math
import cv2
import numpy as np
import mediapipe as mp
from dataclasses import dataclass, field
from typing import Optional

mp_pose = mp.solutions.pose

# ── MediaPipe landmark indices ──────────────────────────────────────────────
L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW,    R_ELBOW    = 13, 14
L_WRIST,    R_WRIST    = 15, 16
L_HIP,      R_HIP      = 23, 24
L_KNEE,     R_KNEE     = 25, 26
L_ANKLE,    R_ANKLE    = 27, 28


@dataclass
class SwingPhases:
    address:       Optional[int] = None   # frame index
    backswing_mid: Optional[int] = None
    top:           Optional[int] = None
    downswing_mid: Optional[int] = None
    impact:        Optional[int] = None
    follow:        Optional[int] = None


@dataclass
class SwingMetrics:
    shoulder_rotation:  float = 0.0   # degrees at top
    hip_rotation:       float = 0.0   # degrees at impact
    x_factor:           float = 0.0   # shoulder - hip at top
    spine_consistency:  float = 0.0   # 0–100%
    knee_flex_address:  float = 0.0   # degrees
    overswing:          bool  = False
    balance_finish:     float = 0.0   # 0–100%


def _angle(a, b, c) -> float:
    """Angle in degrees at vertex b, formed by a→b←c."""
    ba = np.array([a[0] - b[0], a[1] - b[1]])
    bc = np.array([c[0] - b[0], c[1] - b[1]])
    norm = np.linalg.norm(ba) * np.linalg.norm(bc)
    if norm < 1e-9:
        return 0.0
    cos_a = np.dot(ba, bc) / norm
    return math.degrees(math.acos(np.clip(cos_a, -1.0, 1.0)))


def _line_angle(p1, p2) -> float:
    """Angle of line p1→p2 relative to horizontal, in degrees."""
    return math.degrees(math.atan2(p2[1] - p1[1], p2[0] - p1[0]))


def _rotation_delta(p1_a, p2_a, p1_b, p2_b) -> float:
    """Absolute rotation of a line (p1→p2) from pose A to pose B, in degrees."""
    angle_a = _line_angle(p1_a, p2_a)
    angle_b = _line_angle(p1_b, p2_b)
    delta = abs(angle_b - angle_a)
    return min(delta, 360.0 - delta)


def _lm(landmarks, idx):
    """Return (x, y) for a landmark by index."""
    lm = landmarks[idx]
    return (lm.x, lm.y)


def _detect_phases(wrist_y: list[float]) -> SwingPhases:
    """
    Detect swing phases from the right-wrist Y trajectory.
    Y increases downward in image coordinates; we invert so "up" = higher value.
    """
    if len(wrist_y) < 10:
        return SwingPhases()

    n = len(wrist_y)
    inv = [1.0 - y for y in wrist_y]  # invert: up = large

    # Smooth with a simple moving average (window 5)
    smooth = np.convolve(inv, np.ones(5) / 5, mode='same')

    # Address: first stable frames (low variance in first 20% of swing)
    address_end = max(1, n // 5)
    address = address_end // 2

    # Top: global maximum of smoothed curve
    top = int(np.argmax(smooth))

    # Impact: minimum after top, searching in top+10% … top+60% of remaining
    search_start = top + max(1, (n - top) // 10)
    search_end   = top + max(2, (n - top) * 3 // 5)
    search_end   = min(search_end, n - 1)
    if search_start >= n:
        search_start = min(top + 1, n - 1)
    impact_rel = int(np.argmin(smooth[search_start:search_end + 1]))
    impact = search_start + impact_rel

    backswing_mid = (address + top) // 2
    downswing_mid = (top + impact) // 2
    follow        = min(n - 1, impact + (n - impact) // 2)

    return SwingPhases(
        address=address,
        backswing_mid=backswing_mid,
        top=top,
        downswing_mid=downswing_mid,
        impact=impact,
        follow=follow,
    )


def analyze_video(video_path: str) -> tuple[SwingPhases, SwingMetrics]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    all_landmarks = []
    wrist_y       = []

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = pose.process(rgb)
            if result.pose_landmarks:
                lms = result.pose_landmarks.landmark
                all_landmarks.append(lms)
                wrist_y.append(lms[R_WRIST].y)
            else:
                all_landmarks.append(None)
                wrist_y.append(wrist_y[-1] if wrist_y else 0.5)

    cap.release()

    if len(all_landmarks) < 10:
        return SwingPhases(), SwingMetrics()

    phases = _detect_phases(wrist_y)
    metrics = _compute_metrics(all_landmarks, phases, wrist_y)
    return phases, metrics


def _compute_metrics(
    all_landmarks: list,
    phases: SwingPhases,
    wrist_y: list[float],
) -> SwingMetrics:
    n = len(all_landmarks)

    def lms_at(idx: Optional[int]):
        if idx is None or idx >= n or all_landmarks[idx] is None:
            return None
        return all_landmarks[idx]

    metrics = SwingMetrics()

    lm_address = lms_at(phases.address)
    lm_top     = lms_at(phases.top)
    lm_impact  = lms_at(phases.impact)
    lm_follow  = lms_at(phases.follow)

    # ── Shoulder rotation at top ────────────────────────────────────────────
    if lm_address and lm_top:
        ls_a = _lm(lm_address, L_SHOULDER)
        rs_a = _lm(lm_address, R_SHOULDER)
        ls_t = _lm(lm_top,     L_SHOULDER)
        rs_t = _lm(lm_top,     R_SHOULDER)
        metrics.shoulder_rotation = round(_rotation_delta(ls_a, rs_a, ls_t, rs_t), 1)

    # ── Hip rotation at impact ──────────────────────────────────────────────
    if lm_address and lm_impact:
        lh_a = _lm(lm_address, L_HIP)
        rh_a = _lm(lm_address, R_HIP)
        lh_i = _lm(lm_impact,  L_HIP)
        rh_i = _lm(lm_impact,  R_HIP)
        metrics.hip_rotation = round(_rotation_delta(lh_a, rh_a, lh_i, rh_i), 1)

    # ── X-Factor (shoulder - hip rotation at top) ──────────────────────────
    if lm_address and lm_top:
        lh_a  = _lm(lm_address, L_HIP)
        rh_a  = _lm(lm_address, R_HIP)
        lh_t  = _lm(lm_top,     L_HIP)
        rh_t  = _lm(lm_top,     R_HIP)
        hip_at_top = _rotation_delta(lh_a, rh_a, lh_t, rh_t)
        metrics.x_factor = round(metrics.shoulder_rotation - hip_at_top, 1)

    # ── Spine angle consistency address → impact ────────────────────────────
    def _spine_angle(lms) -> float:
        ls = _lm(lms, L_SHOULDER)
        rs = _lm(lms, R_SHOULDER)
        lh = _lm(lms, L_HIP)
        rh = _lm(lms, R_HIP)
        mid_s = ((ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2)
        mid_h = ((lh[0] + rh[0]) / 2, (lh[1] + rh[1]) / 2)
        return _line_angle(mid_h, mid_s)

    if lm_address and lm_impact:
        angle_a = _spine_angle(lm_address)
        angle_i = _spine_angle(lm_impact)
        delta   = abs(angle_i - angle_a)
        # Map 0°=100%, 20°=0%
        metrics.spine_consistency = round(max(0.0, 100.0 - delta * 5.0), 1)

    # ── Knee flex at address ────────────────────────────────────────────────
    if lm_address:
        # Use right leg: hip → knee → ankle
        rh  = _lm(lm_address, R_HIP)
        rk  = _lm(lm_address, R_KNEE)
        ra  = _lm(lm_address, R_ANKLE)
        full_angle   = _angle(rh, rk, ra)
        metrics.knee_flex_address = round(180.0 - full_angle, 1)  # flex = deviation from straight

    # ── Overswing detection ─────────────────────────────────────────────────
    # If wrist at top is significantly higher than at address (>35% of frame height), flag
    if phases.address is not None and phases.top is not None:
        addr_y = wrist_y[phases.address]
        top_y  = wrist_y[phases.top]
        rise   = addr_y - top_y  # positive = wrist went up
        # Heuristic: if wrist rises more than 55% of frame height, likely overswing
        metrics.overswing = rise > 0.55

    # ── Balance in follow-through ────────────────────────────────────────────
    if phases.impact is not None and lm_follow is not None:
        balance_frames = 0
        total_frames   = 0
        for i in range(phases.impact, n):
            lms = all_landmarks[i]
            if lms is None:
                continue
            total_frames += 1
            # COG approximation: midpoint of hips
            lh = _lm(lms, L_HIP)
            rh = _lm(lms, R_HIP)
            la = _lm(lms, L_ANKLE)
            ra = _lm(lms, R_ANKLE)
            cog_x   = (lh[0] + rh[0]) / 2
            # feet center
            feet_x  = (la[0] + ra[0]) / 2
            # balanced = COG within ±10% of feet center
            if abs(cog_x - feet_x) < 0.10:
                balance_frames += 1
        if total_frames > 0:
            metrics.balance_finish = round(100.0 * balance_frames / total_frames, 1)

    return metrics
