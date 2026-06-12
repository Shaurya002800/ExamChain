import numpy as np
import random
from typing import List, Dict, Optional
from loguru import logger


class AdaptiveQuestionSelector:

    def __init__(self, questions: List[dict], initial_theta: float = 0.0):
        self.questions    = {q["id"]: q for q in questions}
        self.all_ids      = [q["id"] for q in questions]
        self.theta        = initial_theta
        self.administered = []
        self.responses    = []

    def select_next(self, exclude_ids: Optional[List[str]] = None) -> Optional[str]:
        exclude    = set(self.administered)
        if exclude_ids:
            exclude.update(exclude_ids)
        candidates = [qid for qid in self.all_ids if qid not in exclude]
        if not candidates:
            return None
        best_id   = None
        best_info = -1
        for qid in candidates:
            q    = self.questions[qid]
            info = self._fisher_information(q, self.theta)
            if info > best_info:
                best_info = info
                best_id   = qid
        if best_id:
            self.administered.append(best_id)
        return best_id

    def select_initial_set(self, n: int = 10) -> List[str]:
        sorted_qs   = sorted(self.all_ids,
                             key=lambda qid: self.questions[qid].get("difficulty", 0.5))
        bucket_size = max(1, len(sorted_qs) // max(n, 1))
        selected    = []
        for i in range(min(n, len(sorted_qs))):
            start  = i * bucket_size
            end    = min(start + bucket_size, len(sorted_qs))
            bucket = sorted_qs[start:end]
            random.shuffle(bucket)
            if bucket:
                selected.append(bucket[0])
                self.administered.append(bucket[0])
        return selected

    def record_response(self, q_id: str, correct: bool, response_time_ms: int):
        self.responses.append((q_id, correct, response_time_ms))
        self.theta = self._update_theta()

    def get_current_ability(self) -> float:
        return round(self.theta, 4)

    def get_stats(self) -> dict:
        n_correct = sum(1 for _, c, _ in self.responses if c)
        return {
            "theta":           round(self.theta, 4),
            "questions_given": len(self.administered),
            "correct":         n_correct,
            "accuracy":        round(n_correct / max(len(self.responses), 1), 3)
        }

    def _icc(self, q: dict, theta: float) -> float:
        a = q.get("discrimination", 1.0)
        b = q.get("difficulty",     0.0)
        c = q.get("guessing",       0.25)
        return c + (1 - c) / (1 + np.exp(-a * (theta - b)))

    def _fisher_information(self, q: dict, theta: float) -> float:
        p  = self._icc(q, theta)
        q_ = 1 - p
        a  = q.get("discrimination", 1.0)
        c  = q.get("guessing",       0.25)
        if p <= 0 or q_ <= 0:
            return 0.0
        p_prime = a * (p - c) * q_ / (1 - c)
        return (p_prime ** 2) / (p * q_)

    def _update_theta(self) -> float:
        if len(self.responses) < 2:
            return self.theta
        theta = self.theta
        for _ in range(20):
            L_prime = L_dprime = 0.0
            for q_id, correct, _ in self.responses:
                q  = self.questions.get(q_id)
                if not q:
                    continue
                p  = self._icc(q, theta)
                q_ = 1 - p
                a  = q.get("discrimination", 1.0)
                c  = q.get("guessing", 0.25)
                w        = a * (p - c) / ((1 - c) * p * max(q_, 1e-10))
                L_prime  += (int(correct) - p) * w
                L_dprime -= p * q_ * (w ** 2)
            if abs(L_dprime) < 1e-10:
                break
            delta  = L_prime / L_dprime
            theta -= delta
            if abs(delta) < 0.001:
                break
        return float(np.clip(theta, -4.0, 4.0))