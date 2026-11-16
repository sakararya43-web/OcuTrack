"""Transparent non-deep-learning statistical baseline for time-series comparison.

Extracts summary features (mean, min, variance, velocity) from raw sequences and evaluates
using standard Scikit-learn classifiers on subject-level splits.
Adheres strictly to adityaImplementation.md Section 12.3 and Section 12.5.
"""

from typing import Any, Dict, List, Tuple
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import GroupKFold


class StatisticalBaseline:
    """Feature-based baseline classifier operating on aggregate summary statistics of sequences."""

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.model = LogisticRegression(random_state=random_state, max_iter=500)
        self.is_fitted = False

    @staticmethod
    def extract_summary_features(sequences: np.ndarray) -> np.ndarray:
        """Extracts statistical summary features from (N, channels, seq_len) sequence tensors.

        Features per channel:
            - Mean
            - Standard deviation
            - Minimum
            - Maximum
            - 25th percentile
            - 75th percentile
        """
        N, C, L = sequences.shape
        feat_list = []

        for i in range(N):
            sample_feats = []
            for c in range(C):
                ch_data = sequences[i, c]
                sample_feats.extend([
                    float(np.mean(ch_data)),
                    float(np.std(ch_data)),
                    float(np.min(ch_data)),
                    float(np.max(ch_data)),
                    float(np.percentile(ch_data, 25)),
                    float(np.percentile(ch_data, 75)),
                ])
            feat_list.append(sample_feats)

        return np.array(feat_list, dtype=np.float32)

    def fit(self, X_seq: np.ndarray, y: np.ndarray) -> "StatisticalBaseline":
        X_feats = self.extract_summary_features(X_seq)
        self.model.fit(X_feats, y)
        self.is_fitted = True
        return self

    def predict(self, X_seq: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("StatisticalBaseline is not fitted yet.")
        X_feats = self.extract_summary_features(X_seq)
        return self.model.predict(X_feats)

    def predict_proba(self, X_seq: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("StatisticalBaseline is not fitted yet.")
        X_feats = self.extract_summary_features(X_seq)
        return self.model.predict_proba(X_feats)

    @classmethod
    def evaluate_grouped_cv(
        cls,
        X_seq: np.ndarray,
        y: np.ndarray,
        groups: List[str],
        n_splits: int = 4,
        random_state: int = 42,
    ) -> Dict[str, float]:
        """Evaluates baseline across subject-level grouped folds to prevent subject leakage."""
        unique_groups = len(set(groups))
        actual_splits = min(n_splits, unique_groups)
        if actual_splits < 2:
            return {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1": 0.0}

        gkf = GroupKFold(n_splits=actual_splits)
        accs, precs, recs, f1s = [], [], [], []

        for train_idx, test_idx in gkf.split(X_seq, y, groups):
            baseline = cls(random_state=random_state)
            baseline.fit(X_seq[train_idx], y[train_idx])
            preds = baseline.predict(X_seq[test_idx])

            accs.append(accuracy_score(y[test_idx], preds))
            precs.append(precision_score(y[test_idx], preds, zero_division=0))
            recs.append(recall_score(y[test_idx], preds, zero_division=0))
            f1s.append(f1_score(y[test_idx], preds, zero_division=0))

        return {
            "accuracy": round(float(np.mean(accs)), 4),
            "precision": round(float(np.mean(precs)), 4),
            "recall": round(float(np.mean(recs)), 4),
            "f1": round(float(np.mean(f1s)), 4),
        }
