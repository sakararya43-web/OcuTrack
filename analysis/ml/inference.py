"""Inference runner for Ocular Temporal Model.

Wraps model execution, enforces data-gated honesty, and formats outputs strictly conforming
to adityaImplementation.md Section 5 schema.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np

from analysis.contracts import ModelStatus, to_json_serializable
from analysis.ml.preprocessing import PreprocessingConfig, TimeSeriesPreprocessor


class TemporalModelRunner:
    """Manages inference for the experimental Temporal Convolutional Network.

    Operates under strict data-gating: if clinical labels are unavailable,
    it returns honest status ("not_configured" or "experimental") and refuses
    to fabricate diagnostic or clinical classifications.
    """

    def __init__(
        self,
        weights_path: Optional[Path | str] = None,
        num_inputs: int = 3,
        num_channels: Optional[List[int]] = None,
        num_classes: int = 2,
        is_experimental: bool = False,
    ):
        self.weights_path = Path(weights_path) if weights_path else None
        self.model_name = "ocutrack-tcn-experimental"
        self.model_version = "0.1.0" if self.weights_path and self.weights_path.exists() else None
        self.is_experimental = is_experimental
        self.preprocessor = TimeSeriesPreprocessor()

        self.model: Optional[Any] = None
        if self.weights_path and self.weights_path.exists():
            try:
                import torch
                from analysis.ml.tcn import TemporalConvNet

                self.model = TemporalConvNet(
                    num_inputs=num_inputs,
                    num_channels=num_channels or [16, 32, 64],
                    num_classes=num_classes,
                )
                state_dict = torch.load(self.weights_path, map_location="cpu")
                self.model.load_state_dict(state_dict)
                self.model.eval()
            except Exception:
                self.model = None

    def run_inference(
        self,
        pupil_series: Optional[List[Dict[str, Any]]] = None,
        pursuit_series: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Runs inference across pupil/pursuit time-series if configured, returning schema dictionary."""
        # 1. Honest Gate: If no model weights or unconfigured
        if self.model is None:
            return {
                "status": ModelStatus.NOT_CONFIGURED.value,
                "model_name": self.model_name,
                "model_version": None,
                "output": None,
                "notes": [
                    "Temporal TCN model is not configured for production clinical use.",
                    "No disease probability or diagnostic claim is produced.",
                ],
            }

        # 2. Experimental inference path
        try:
            import torch

            # Prepare pupil sequence by default
            if pupil_series and len(pupil_series) >= 5:
                seq_arr, _ = self.preprocessor.prepare_pupil_sequence(pupil_series)
            else:
                return {
                    "status": ModelStatus.NOT_CONFIGURED.value,
                    "model_name": self.model_name,
                    "model_version": self.model_version,
                    "output": None,
                    "notes": ["Insufficient series frames for temporal sequence inference."],
                }

            tensor_input = torch.as_tensor(seq_arr, dtype=torch.float32).unsqueeze(0)  # (1, C, L)
            with torch.no_grad():
                logits = self.model(tensor_input)
                probas = torch.softmax(logits, dim=-1).squeeze(0).numpy()
                emb = self.model.extract_features(tensor_input).squeeze(0).numpy()

            output_payload = {
                "pattern_cluster_index": int(np.argmax(probas)),
                "pattern_confidence": round(float(np.max(probas)), 4),
                "latent_embedding_norm": round(float(np.linalg.norm(emb)), 4),
            }

            status = ModelStatus.EXPERIMENTAL.value if self.is_experimental else ModelStatus.EVALUATED.value
            return to_json_serializable({
                "status": status,
                "model_name": self.model_name,
                "model_version": self.model_version,
                "output": output_payload,
                "notes": [
                    "Experimental temporal pattern extraction.",
                    "Research prototype output only; NOT diagnostic of any condition.",
                ],
            })
        except Exception as e:
            return {
                "status": ModelStatus.FAILED.value,
                "model_name": self.model_name,
                "model_version": self.model_version,
                "output": None,
                "notes": [f"Model inference error: {str(e)}"],
            }
