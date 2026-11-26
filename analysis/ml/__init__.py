"""OcuTrack Temporal Machine Learning Workstream.

Provides sequence preprocessing, Temporal Convolutional Network (TCN),
transparent statistical baselines, participant-partitioned training,
and honest data-gated inference.
"""

from analysis.ml.inference import TemporalModelRunner
from analysis.ml.preprocessing import PreprocessingConfig, TimeSeriesPreprocessor

try:
    from analysis.ml.baseline import StatisticalBaseline
    from analysis.ml.dataset import OcularSequenceDataset, generate_synthetic_experimental_dataset
    from analysis.ml.evaluation import compare_model_with_baseline, compute_classification_metrics
except ImportError:  # pragma: no cover - optional scikit-learn dependency
    StatisticalBaseline = None  # type: ignore[assignment,misc]
    OcularSequenceDataset = None  # type: ignore[assignment,misc]
    generate_synthetic_experimental_dataset = None  # type: ignore[assignment]
    compare_model_with_baseline = None  # type: ignore[assignment]
    compute_classification_metrics = None  # type: ignore[assignment]

try:
    from analysis.ml.tcn import ChausalConv1d, TemporalBlock, TemporalConvNet
    from analysis.ml.train import TrainingConfig, run_training_experiment
except ImportError:  # pragma: no cover - optional PyTorch dependency
    ChausalConv1d = None  # type: ignore[assignment,misc]
    TemporalBlock = None  # type: ignore[assignment,misc]
    TemporalConvNet = None  # type: ignore[assignment,misc]
    TrainingConfig = None  # type: ignore[assignment,misc]
    run_training_experiment = None  # type: ignore[assignment]

__all__ = [
    "ChausalConv1d",
    "OcularSequenceDataset",
    "PreprocessingConfig",
    "StatisticalBaseline",
    "TemporalBlock",
    "TemporalConvNet",
    "TemporalModelRunner",
    "TimeSeriesPreprocessor",
    "TrainingConfig",
    "compare_model_with_baseline",
    "compute_classification_metrics",
    "generate_synthetic_experimental_dataset",
    "run_training_experiment",
]
