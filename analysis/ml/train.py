"""Reproducible training pipeline for Ocular Temporal Convolutional Network.

Enforces subject-level train/validation split, seeded configuration, and checkpoint export.
Adheres strictly to adityaImplementation.md Section 12.3 and Section 12.5.
"""

from dataclasses import asdict, dataclass
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from sklearn.model_selection import GroupShuffleSplit
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from analysis.ml.dataset import OcularSequenceDataset, generate_synthetic_experimental_dataset
from analysis.ml.tcn import TemporalConvNet


@dataclass
class TrainingConfig:
    seed: int = 42
    epochs: int = 15
    batch_size: int = 8
    learning_rate: float = 1e-3
    weight_decay: float = 1e-4
    sequence_length: int = 128
    num_inputs: int = 3
    num_channels: Tuple[int, ...] = (16, 32, 64)
    kernel_size: int = 3
    dropout: float = 0.2
    num_classes: int = 2
    test_size: float = 0.25


def set_seed(seed: int = 42) -> None:
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def train_epoch(
    model: nn.Module,
    loader: DataLoader,
    optimizer: torch.optim.Optimizer,
    criterion: nn.Module,
) -> float:
    model.train()
    total_loss = 0.0
    for x, y, _ in loader:
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        total_loss += float(loss.item()) * len(y)
    return total_loss / len(loader.dataset)


def evaluate(
    model: nn.Module,
    loader: DataLoader,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    model.eval()
    all_preds, all_probas, all_targets = [], [], []
    with torch.no_grad():
        for x, y, _ in loader:
            logits = model(x)
            probas = torch.softmax(logits, dim=-1)
            preds = torch.argmax(probas, dim=-1)
            all_preds.extend(preds.cpu().numpy())
            all_probas.extend(probas.cpu().numpy())
            all_targets.extend(y.cpu().numpy())
    return np.array(all_targets), np.array(all_preds), np.array(all_probas)


def run_training_experiment(
    dataset: OcularSequenceDataset,
    config: Optional[TrainingConfig] = None,
    checkpoint_dir: Optional[Path] = None,
) -> Tuple[TemporalConvNet, Dict[str, Any]]:
    """Runs a reproducible, participant-partitioned training experiment."""
    cfg = config or TrainingConfig()
    set_seed(cfg.seed)

    X = dataset.sequences.numpy()
    y = dataset.labels.numpy() if dataset.labels is not None else np.zeros(len(X), dtype=int)
    groups = np.array(dataset.subject_ids)

    # Participant-level train/validation split
    gss = GroupShuffleSplit(n_splits=1, test_size=cfg.test_size, random_state=cfg.seed)
    train_idx, val_idx = next(gss.split(X, y, groups))

    train_ds = OcularSequenceDataset(X[train_idx], y[train_idx], list(groups[train_idx]))
    val_ds = OcularSequenceDataset(X[val_idx], y[val_idx], list(groups[val_idx]))

    train_loader = DataLoader(train_ds, batch_size=cfg.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=cfg.batch_size, shuffle=False)

    model = TemporalConvNet(
        num_inputs=cfg.num_inputs,
        num_channels=list(cfg.num_channels),
        kernel_size=cfg.kernel_size,
        dropout=cfg.dropout,
        num_classes=cfg.num_classes,
    )

    optimizer = torch.optim.Adam(model.parameters(), lr=cfg.learning_rate, weight_decay=cfg.weight_decay)
    criterion = nn.CrossEntropyLoss()

    history = []
    for epoch in range(cfg.epochs):
        train_loss = train_epoch(model, train_loader, optimizer, criterion)
        history.append({"epoch": epoch + 1, "train_loss": round(train_loss, 4)})

    val_true, val_pred, val_proba = evaluate(model, val_loader)
    from analysis.ml.evaluation import compute_classification_metrics
    val_metrics = compute_classification_metrics(val_true, val_pred, val_proba)

    experiment_report = {
        "config": asdict(cfg),
        "history": history,
        "validation_metrics": val_metrics,
        "train_subjects": list(set(groups[train_idx])),
        "val_subjects": list(set(groups[val_idx])),
        "receptive_field": model.receptive_field,
    }

    if checkpoint_dir:
        checkpoint_dir.mkdir(parents=True, exist_ok=True)
        torch.save(model.state_dict(), checkpoint_dir / "tcn_weights.pt")
        with open(checkpoint_dir / "experiment_report.json", "w", encoding="utf-8") as f:
            json.dump(experiment_report, f, indent=2)

    return model, experiment_report
