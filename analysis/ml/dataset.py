"""Dataset representation and participant-level sequence loading for Ocular ML.

Enforces subject-level grouping to prevent data leakage across train/validation/test splits.
Adheres strictly to adityaImplementation.md Section 12.3 and Section 12.5.
"""

from typing import List, Optional, Tuple
import numpy as np
import torch
from torch.utils.data import Dataset


class OcularSequenceDataset(Dataset):
    """PyTorch Dataset holding preprocessed ocular time-series sequences with subject identifiers."""

    def __init__(
        self,
        sequences: np.ndarray,
        labels: Optional[np.ndarray] = None,
        subject_ids: Optional[List[str]] = None,
    ):
        """Args:

        sequences: Array of shape (N, channels, sequence_length)
        labels: Optional target labels array of shape (N,)
        subject_ids: List of participant identifiers of length N
        """
        self.sequences = torch.as_tensor(sequences, dtype=torch.float32)
        self.labels = (
            torch.as_tensor(labels, dtype=torch.long)
            if labels is not None
            else None
        )
        self.subject_ids = (
            subject_ids
            if subject_ids is not None
            else [f"sub_{i}" for i in range(len(sequences))]
        )

        assert len(self.sequences) == len(self.subject_ids), (
            f"Mismatched counts: {len(self.sequences)} sequences vs {len(self.subject_ids)} subject IDs"
        )
        if self.labels is not None:
            assert len(self.sequences) == len(self.labels), (
                f"Mismatched counts: {len(self.sequences)} sequences vs {len(self.labels)} labels"
            )

    def __len__(self) -> int:
        return len(self.sequences)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, Optional[torch.Tensor], str]:
        x = self.sequences[idx]
        y = self.labels[idx] if self.labels is not None else torch.tensor(-1, dtype=torch.long)
        sub_id = self.subject_ids[idx]
        return x, y, sub_id


def generate_synthetic_experimental_dataset(
    num_subjects: int = 12,
    recordings_per_subject: int = 3,
    sequence_length: int = 128,
    num_channels: int = 3,
    seed: int = 42,
) -> OcularSequenceDataset:
    """Generates a reproducible simulated time-series dataset for technical testing.

    Used strictly for code-path unit tests and evaluation pipelines where clinical data is absent.
    Does NOT claim real patient physiology or clinical diagnostic validity.
    """
    rng = np.random.default_rng(seed)
    total_samples = num_subjects * recordings_per_subject

    seqs = np.zeros((total_samples, num_channels, sequence_length), dtype=np.float32)
    labels = np.zeros(total_samples, dtype=np.int64)
    subject_ids = []

    idx = 0
    for s in range(num_subjects):
        sub_id = f"participant_{s:03d}"
        # Binary synthetic condition (e.g. sluggish vs normal constriction dynamics)
        sub_label = s % 2

        for r in range(recordings_per_subject):
            t = np.linspace(0, 1, sequence_length, dtype=np.float32)
            # Simulated pupil reflex wave
            onset = 0.3 + rng.normal(0, 0.02)
            amp = 0.8 if sub_label == 1 else 0.4
            curve = np.where(t > onset, -amp * np.exp(-(t - onset) * 4.0), 0.0)
            noise = rng.normal(0, 0.05, sequence_length).astype(np.float32)

            ch0 = curve + noise
            ch1 = np.gradient(ch0)
            ch2 = np.ones(sequence_length, dtype=np.float32)  # valid mask

            seqs[idx, 0] = ch0
            seqs[idx, 1] = ch1
            seqs[idx, 2] = ch2
            labels[idx] = sub_label
            subject_ids.append(sub_id)
            idx += 1

    return OcularSequenceDataset(seqs, labels, subject_ids)
