"""
Maps swing metrics to structured German feedback messages.
Each item has: category, type (POSITIVE|IMPROVEMENT), message, metric, actual, target.
"""

from dataclasses import dataclass
from typing import Optional
from analyzer import SwingMetrics


@dataclass
class FeedbackItem:
    category: str          # POSTURE | BACKSWING | DOWNSWING | IMPACT | FOLLOWTHROUGH
    type:     str          # POSITIVE | IMPROVEMENT
    message:  str
    metric:   Optional[str] = None
    actual:   Optional[float] = None
    target:   Optional[float] = None


def generate_feedback(metrics: SwingMetrics) -> tuple[list[FeedbackItem], int]:
    """Return (feedback_list, overall_score 0–100)."""
    items: list[FeedbackItem] = []
    score_parts: list[float] = []

    # ── Shoulder Rotation ───────────────────────────────────────────────────
    sr = metrics.shoulder_rotation
    if sr >= 85:
        items.append(FeedbackItem(
            category="BACKSWING", type="POSITIVE",
            message=f"Exzellente Schulterdrehung von {sr:.0f}° — du erzeugst maximales Drehmoment.",
            metric="shoulder_rotation", actual=sr, target=90.0,
        ))
        score_parts.append(100)
    elif sr >= 70:
        items.append(FeedbackItem(
            category="BACKSWING", type="POSITIVE",
            message=f"Gute Schulterdrehung ({sr:.0f}°). Etwas mehr Rotation würde deinen Schwung weiter optimieren.",
            metric="shoulder_rotation", actual=sr, target=90.0,
        ))
        score_parts.append(75)
    elif sr >= 50:
        items.append(FeedbackItem(
            category="BACKSWING", type="IMPROVEMENT",
            message=f"Deine Schulterdrehung beträgt nur {sr:.0f}° (Ziel: ≥ 85°). Arbeite an der Thorax-Mobilität — Schulterrotationsübungen helfen direkt.",
            metric="shoulder_rotation", actual=sr, target=85.0,
        ))
        score_parts.append(40)
    else:
        items.append(FeedbackItem(
            category="BACKSWING", type="IMPROVEMENT",
            message=f"Schulterdrehung stark eingeschränkt ({sr:.0f}°). Prüfe ob Verspannungen im Oberkörper die Rotation blockieren.",
            metric="shoulder_rotation", actual=sr, target=85.0,
        ))
        score_parts.append(15)

    # ── Hip Rotation ────────────────────────────────────────────────────────
    hr = metrics.hip_rotation
    if 38 <= hr <= 55:
        items.append(FeedbackItem(
            category="IMPACT", type="POSITIVE",
            message=f"Hüftdrehung zum Impact perfekt ({hr:.0f}°) — ideale Kraftübertragung auf den Ball.",
            metric="hip_rotation", actual=hr, target=45.0,
        ))
        score_parts.append(100)
    elif hr > 55:
        items.append(FeedbackItem(
            category="IMPACT", type="IMPROVEMENT",
            message=f"Hüfte dreht zu früh durch ({hr:.0f}°, Ziel: 40–50°). Das führt zu einem Over-the-Top Schwungpfad — versuche die Hüfte erst im Durchschwung zu öffnen.",
            metric="hip_rotation", actual=hr, target=45.0,
        ))
        score_parts.append(50)
    elif hr >= 25:
        items.append(FeedbackItem(
            category="IMPACT", type="IMPROVEMENT",
            message=f"Hüftdrehung zum Impact etwas zu gering ({hr:.0f}°, Ziel: 40–50°). Aktiviere die Hüfte bewusst beim Durchschwung.",
            metric="hip_rotation", actual=hr, target=45.0,
        ))
        score_parts.append(60)
    else:
        items.append(FeedbackItem(
            category="IMPACT", type="IMPROVEMENT",
            message=f"Kaum Hüftdrehung erkannt ({hr:.0f}°). Die Kraft kommt ausschließlich aus Armen — das kostet Weite und Kontrolle.",
            metric="hip_rotation", actual=hr, target=45.0,
        ))
        score_parts.append(20)

    # ── X-Factor ────────────────────────────────────────────────────────────
    xf = metrics.x_factor
    if xf >= 35:
        items.append(FeedbackItem(
            category="BACKSWING", type="POSITIVE",
            message=f"Starker X-Faktor von {xf:.0f}° — die Spannung zwischen Schulter- und Hüftdrehung maximiert deine Schlägerkopfgeschwindigkeit.",
            metric="x_factor", actual=xf, target=40.0,
        ))
        score_parts.append(100)
    elif xf >= 20:
        items.append(FeedbackItem(
            category="BACKSWING", type="IMPROVEMENT",
            message=f"X-Faktor ausbaufähig ({xf:.0f}°, Ziel: ≥ 35°). Erhöhe den Widerstand: mehr Schulter- bei gleichzeitig weniger Hüftdrehung im Rückschwung.",
            metric="x_factor", actual=xf, target=35.0,
        ))
        score_parts.append(55)
    else:
        items.append(FeedbackItem(
            category="BACKSWING", type="IMPROVEMENT",
            message=f"X-Faktor sehr niedrig ({xf:.0f}°). Schulter- und Hüfte drehen gleichzeitig — das reduziert die gespeicherte Energie deutlich.",
            metric="x_factor", actual=xf, target=35.0,
        ))
        score_parts.append(25)

    # ── Spine Consistency ───────────────────────────────────────────────────
    sc = metrics.spine_consistency
    if sc >= 80:
        items.append(FeedbackItem(
            category="POSTURE", type="POSITIVE",
            message=f"Sehr konstanter Rückenwinkel ({sc:.0f}% Konsistenz) — solide Basis für reproduzierbare Treffer.",
            metric="spine_consistency", actual=sc, target=85.0,
        ))
        score_parts.append(100)
    elif sc >= 60:
        items.append(FeedbackItem(
            category="POSTURE", type="IMPROVEMENT",
            message=f"Rückenwinkel leicht inkonstant ({sc:.0f}%). Ein stabiler Spine Angle verbessert die Treffsicherheit — achte darauf, den Winkel bis zum Impact zu halten.",
            metric="spine_consistency", actual=sc, target=80.0,
        ))
        score_parts.append(60)
    else:
        items.append(FeedbackItem(
            category="POSTURE", type="IMPROVEMENT",
            message=f"Rückenwinkel stark verändert ({sc:.0f}% Konsistenz). 'Early Extension' (Hüfte schiebt vor) oder 'Reverse Pivot' — beide führen zu Fehltreffern.",
            metric="spine_consistency", actual=sc, target=80.0,
        ))
        score_parts.append(25)

    # ── Knee Flex at Address ─────────────────────────────────────────────────
    kf = metrics.knee_flex_address
    if 14 <= kf <= 26:
        items.append(FeedbackItem(
            category="POSTURE", type="POSITIVE",
            message=f"Kniebeuge in der Adressposition optimal ({kf:.0f}°) — athletische Grundhaltung.",
            metric="knee_flex_address", actual=kf, target=20.0,
        ))
        score_parts.append(100)
    elif kf < 14:
        items.append(FeedbackItem(
            category="POSTURE", type="IMPROVEMENT",
            message=f"Knie zu wenig gebeugt in der Adresse ({kf:.0f}°, Ziel: 15–25°). Mehr Flex ermöglicht bessere Rotation und Kraftübertragung.",
            metric="knee_flex_address", actual=kf, target=20.0,
        ))
        score_parts.append(50)
    else:
        items.append(FeedbackItem(
            category="POSTURE", type="IMPROVEMENT",
            message=f"Knie zu stark gebeugt ({kf:.0f}°, Ziel: 15–25°). Das erschwert die freie Hüftdrehung.",
            metric="knee_flex_address", actual=kf, target=20.0,
        ))
        score_parts.append(60)

    # ── Overswing ────────────────────────────────────────────────────────────
    if metrics.overswing:
        items.append(FeedbackItem(
            category="BACKSWING", type="IMPROVEMENT",
            message="Overswing erkannt: der Schläger überschreitet die Parallele. Das macht den Timing-Punkt schwieriger zu treffen — versuche den Rückschwung bewusst zu verkürzen.",
            metric="overswing",
        ))
        score_parts.append(40)
    else:
        items.append(FeedbackItem(
            category="BACKSWING", type="POSITIVE",
            message="Kein Overswing — Rückschwunglänge gut kontrolliert.",
            metric="overswing",
        ))
        score_parts.append(90)

    # ── Balance in Follow-Through ─────────────────────────────────────────────
    bf = metrics.balance_finish
    if bf >= 75:
        items.append(FeedbackItem(
            category="FOLLOWTHROUGH", type="POSITIVE",
            message=f"Ausgezeichnete Balance im Finish ({bf:.0f}%) — du hältst das Gleichgewicht bis zum Ende.",
            metric="balance_finish", actual=bf, target=80.0,
        ))
        score_parts.append(100)
    elif bf >= 50:
        items.append(FeedbackItem(
            category="FOLLOWTHROUGH", type="IMPROVEMENT",
            message=f"Balance im Finish ausbaufähig ({bf:.0f}%, Ziel: ≥ 75%). Übe den 'Statue of Liberty' Finish: vollständig aufrichten und 3 Sekunden halten.",
            metric="balance_finish", actual=bf, target=75.0,
        ))
        score_parts.append(60)
    else:
        items.append(FeedbackItem(
            category="FOLLOWTHROUGH", type="IMPROVEMENT",
            message=f"Starkes Gleichgewichtsproblem im Finish ({bf:.0f}%). Reduziere zunächst die Schwunggeschwindigkeit und baue Balance bewusst auf.",
            metric="balance_finish", actual=bf, target=75.0,
        ))
        score_parts.append(25)

    overall = int(sum(score_parts) / len(score_parts)) if score_parts else 50
    return items, overall
