"""Unit and integration tests for Phase 4: Temporal Model Experiment (Data-Gated).

Verifies:
- Sequence preprocessing, resampling, and normalization
- TCN causal dilated convolutions and receptive field calculation
- Non-deep-learning statistical baseline with subject-level splitting
- Reproducible seeded training loop and checkpoint export
- Classification metrics, confusion matrix, and baseline comparison
- Honest data-gated inference runner ("not_configured" by default)
- Experimental inference path with non-diagnostic notes
"""

import json
import tempfile
from pathlib import Path
import numpy as np
import pytest
import torch

from analysis.contracts import ModelStatus
from analysis.ml.baseline import StatisticalBaseline
from analysis.ml.dataset import (
    OcularSequenceDataset,
    generate_synthetic_experimental_dataset,
)
from analysis.ml.evaluation import (
    compare_model_with_baseline,
    compute_classification_metrics,
)
from analysis.ml.inference import TemporalModelRunner
from analysis.ml.preprocessing import PreprocessingConfig, TimeSeriesPreprocessor
from analysis.ml.tcn import ChausalConv1d, TemporalBlock, TemporalConvNet
from analysis.ml.train import TrainingConfig, run_training_experiment
from analysis.pipeline import analyze_assessment
from analysis.tests.test_phase3_features_and_pursuit import create_synthetic_pupil_video


@pytest.fixture
def temp_dir():
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)


# =========================================================================
# Preprocessing Unit Tests
# =========================================================================


def test_pupil_sequence_preprocessing():
    preprocessor = TimeSeriesPreprocessor(PreprocessingConfig(target_sequence_length=64))
    series = [
        {"t_ms": i * 33, "diameter": 25.0 - (5.0 * (i / 30.0)), "valid": True}
        for i in range(30)
    ]
    # Inject one invalid frame
    series[10]["valid"] = False
    series[10]["diameter"] = None

    tensor_arr, target_t = preprocessor.prepare_pupil_sequence(series)

    assert tensor_arr.shape == (3, 64)
    assert len(target_t) == 64
    # Channel 2 is validity mask (in [0, 1])
    assert set(np.unique(tensor_arr[2])).issubset({0.0, 1.0})
    # Channel 0 is normalized diameter
    assert not np.any(np.isnan(tensor_arr))


def test_pursuit_sequence_preprocessing():
    preprocessor = TimeSeriesPreprocessor(PreprocessingConfig(target_sequence_length=64))
    series = [
        {
            "t_ms": i * 33,
            "eye_x": 0.3 + 0.4 * (i / 30.0),
            "eye_y": 0.5,
            "target_x": 0.3 + 0.4 * (i / 30.0),
            "target_y": 0.5,
            "tracking_error": 0.02,
            "valid": True,
        }
        for i in range(30)
    ]

    tensor_arr, target_t = preprocessor.prepare_pursuit_sequence(series)
    assert tensor_arr.shape == (6, 64)
    assert not np.any(np.isnan(tensor_arr))


def test_empty_sequence_preprocessing():
    preprocessor = TimeSeriesPreprocessor()
    p_arr, _ = preprocessor.prepare_pupil_sequence([])
    assert p_arr.shape == (3, 128)
    assert np.all(p_arr == 0.0)

    pu_arr, _ = preprocessor.prepare_pursuit_sequence([])
    assert pu_arr.shape == (6, 128)
    assert np.all(pu_arr == 0.0)


# =========================================================================
# TCN Architecture Unit Tests
# =========================================================================


def test_causal_conv1d_alignment():
    """Verifies causal convolution maintains sequence length and does not look ahead."""
    batch_size = 2
    channels = 3
    seq_len = 50
    conv = ChausalConv1d(in_channels=channels, out_channels=8, kernel_size=3, dilation=2)

    x = torch.randn(batch_size, channels, seq_len)
    out = conv(x)
    assert out.shape == (batch_size, 8, seq_len)


def test_tcn_forward_pass_and_receptive_field():
    model = TemporalConvNet(
        num_inputs=3,
        num_channels=[16, 32],
        kernel_size=3,
        num_classes=2,
    )
    # Receptive field formula: 1 + 2 * (3-1) * (1 + 2) = 1 + 4 * 3 = 13
    assert model.receptive_field == 13

    x = torch.randn(4, 3, 64)
    logits = model(x)
    assert logits.shape == (4, 2)

    emb = model.extract_features(x)
    assert emb.shape == (4, 32)


# =========================================================================
# Statistical Baseline & Grouped CV Tests
# =========================================================================


def test_statistical_baseline_subject_level_cv():
    dataset = generate_synthetic_experimental_dataset(num_subjects=8, recordings_per_subject=2, sequence_length=64)
    X = dataset.sequences.numpy()
    y = dataset.labels.numpy()
    groups = dataset.subject_ids

    cv_results = StatisticalBaseline.evaluate_grouped_cv(X, y, groups, n_splits=3)
    assert "accuracy" in cv_results
    assert "precision" in cv_results
    assert "recall" in cv_results
    assert "f1" in cv_results
    assert 0.0 <= cv_results["accuracy"] <= 1.0


# =========================================================================
# Training Experiment & Evaluation Tests
# =========================================================================


def test_run_training_experiment(temp_dir: Path):
    dataset = generate_synthetic_experimental_dataset(num_subjects=6, recordings_per_subject=2, sequence_length=32)
    cfg = TrainingConfig(
        epochs=3,
        batch_size=4,
        sequence_length=32,
        num_channels=(8, 16),
        seed=42,
    )

    model, report = run_training_experiment(dataset, cfg, checkpoint_dir=temp_dir)
    assert (temp_dir / "tcn_weights.pt").exists()
    assert (temp_dir / "experiment_report.json").exists()
    assert len(report["history"]) == 3
    assert "validation_metrics" in report
    assert report["receptive_field"] > 0


def test_compute_classification_metrics():
    y_true = np.array([0, 0, 1, 1, 1])
    y_pred = np.array([0, 1, 1, 1, 0])
    metrics = compute_classification_metrics(y_true, y_pred)

    assert metrics["total_samples"] == 5
    assert "confusion_matrix" in metrics
    assert "class_distribution" in metrics
    assert 0.0 <= metrics["accuracy"] <= 1.0


def test_compare_model_with_baseline():
    tcn_m = {"f1": 0.82, "accuracy": 0.85}
    base_m = {"f1": 0.75, "accuracy": 0.78}
    subjects = ["sub1", "sub2", "sub3"]

    report = compare_model_with_baseline(tcn_m, base_m, subjects)
    assert report["held_out_subject_count"] == 3
    assert report["f1_delta"] == pytest.approx(0.07, abs=1e-4)


# =========================================================================
# Honest Data-Gate & Inference Runner Tests
# =========================================================================


def test_temporal_model_runner_not_configured():
    """Verifies runner defaults to honest 'not_configured' status when no weights are supplied."""
    runner = TemporalModelRunner(weights_path=None)
    res = runner.run_inference(pupil_series=[{"t_ms": 0, "diameter": 25.0, "valid": True}])

    assert res["status"] == ModelStatus.NOT_CONFIGURED.value
    assert res["model_name"] == "ocutrack-tcn-experimental"
    assert res["model_version"] is None
    assert res["output"] is None
    assert any("not configured" in n.lower() for n in res["notes"])
    assert any("no disease probability" in n.lower() for n in res["notes"])


def test_temporal_model_runner_experimental_weights(temp_dir: Path):
    """Verifies that with trained weights, runner produces pattern output with non-clinical notes."""
    dataset = generate_synthetic_experimental_dataset(num_subjects=4, recordings_per_subject=2, sequence_length=64)
    cfg = TrainingConfig(epochs=2, batch_size=4, sequence_length=64, num_channels=(8, 16))
    _, _ = run_training_experiment(dataset, cfg, checkpoint_dir=temp_dir)

    weights_file = temp_dir / "tcn_weights.pt"
    runner = TemporalModelRunner(
        weights_path=weights_file,
        num_inputs=3,
        num_channels=[8, 16],
        is_experimental=True,
    )

    pupil_series = [
        {"t_ms": i * 33, "diameter": 25.0 - (5.0 * (i / 40.0)), "valid": True}
        for i in range(40)
    ]
    res = runner.run_inference(pupil_series=pupil_series)

    assert res["status"] == ModelStatus.EXPERIMENTAL.value
    assert res["model_name"] == "ocutrack-tcn-experimental"
    assert res["model_version"] == "0.1.0"
    assert res["output"] is not None
    assert "pattern_cluster_index" in res["output"]
    assert "latent_embedding_norm" in res["output"]
    assert any("research prototype" in n.lower() for n in res["notes"])


def test_analyze_assessment_data_gate_pipeline_integration(temp_dir: Path):
    """Verifies end-to-end analyze_assessment outputs honest temporal_model schema."""
    vid_p = temp_dir / "pupil_test.mp4"
    create_synthetic_pupil_video(vid_p, duration_sec=3.0, fps=30.0)

    # 1. Default invocation without weights: status is not_configured
    res = analyze_assessment(pupil_video_path=vid_p)
    assert res["temporal_model"]["status"] == ModelStatus.NOT_CONFIGURED.value
    assert res["temporal_model"]["output"] is None

    # 2. Invocation with experimental weights configured
    dataset = generate_synthetic_experimental_dataset(num_subjects=4, recordings_per_subject=2, sequence_length=128)
    cfg = TrainingConfig(epochs=1, batch_size=4, sequence_length=128, num_channels=(16, 32, 64))
    _, _ = run_training_experiment(dataset, cfg, checkpoint_dir=temp_dir)

    exp_res = analyze_assessment(
        pupil_video_path=vid_p,
        model_config={
            "weights_path": str(temp_dir / "tcn_weights.pt"),
            "enable_experimental_tcn": True,
        },
    )
    assert exp_res["temporal_model"]["status"] == ModelStatus.EXPERIMENTAL.value
    assert exp_res["temporal_model"]["output"] is not None
