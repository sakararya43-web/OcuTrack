"""OcuTrack Temporal Machine Learning Workstream.

Provides sequence preprocessing, Temporal Convolutional Network (TCN),
transparent statistical baselines, participant-partitioned training,
and honest data-gated inference.
"""

from analysis.ml.baseline import StatisticalBaseline
from analysis.ml.dataset import OcularSequenceDataset, generate_synthetic_experimental_dataset
from analysis.ml.evaluation import compare_model_with_baseline, compute_classification_metrics
from analysis.ml.inference import TemporalModelRunner
from analysis.ml.preprocessing import PreprocessingConfig, TimeSeriesPreprocessor
from analysis.ml.tcn import ChausalConv1d, TemporalBlock, TemporalConvNet
from analysis.ml.train import TrainingConfig, run_training_experiment

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
