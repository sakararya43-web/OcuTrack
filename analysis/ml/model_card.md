# OcuTrack Model Card — Experimental Temporal Convolutional Network (TCN)

**Model Name:** `ocutrack-tcn-experimental`  
**Model Version:** `0.1.0-experimental`  
**Model Type:** 1D Dilated Causal Temporal Convolutional Network  
**Author:** Aditya (Computer Vision & ML Workstream)  
**Parent Specifications:** `adityaImplementation.md` (Sections 12, 14, 15)  

---

## 1. Model Architecture & Parameters

The model analyses the chronological sequence of pupil responses and eye movements within an individual recording to extract temporal patterns without temporal future leakage.

- **Convolution Type:** 1D Causal Dilated Convolutions
- **Receptive Field Formula:**
  $$\text{RF} = 1 + 2 \cdot (\text{kernel\_size} - 1) \cdot \sum_{l=0}^{L-1} d_l$$
  With kernel size $K=3$ and dilations $[1, 2, 4]$, theoretical receptive field is:
  $$\text{RF} = 1 + 2 \cdot (3 - 1) \cdot (1 + 2 + 4) = 1 + 4 \cdot 7 = 29 \text{ temporal steps}$$
- **Input Dimensions:** `(batch_size, channels, sequence_length)` where $L=128$.
  - Pupil Channels: `[diameter, velocity, valid_mask]` ($C=3$)
  - Pursuit Channels: `[eye_x, eye_y, target_x, target_y, tracking_error, valid_mask]` ($C=6$)
- **Hidden Channels:** $[16, 32, 64]$
- **Normalization & Regularization:** Batch Normalization, ReLU activations, Spatial Dropout ($p=0.20$), residual skip connections.
- **Output Head:** Adaptive average pooling followed by linear projection.

---

## 2. Intended Use & Target Tasks

- **Intended Scope:** Extracting within-recording temporal dynamics (such as contraction shape, latency-related wave characteristics, and tracking continuity) to assist visual inspection in research workflows.
- **Experimental Technical Component:** Designed as a prototype architecture demonstrating reproducible participant-level sequence learning.

---

## 3. Strictly Prohibited & Unsupported Uses

> [!CAUTION]
> **OcuTrack does NOT diagnose Parkinson's disease, concussion, diabetic neuropathy, or any other medical condition.**
>
> The model MUST NEVER be used for:
> - Standalone medical screening or triage without clinical oversight.
> - Diagnostic inference or predicting clinical disease labels.
> - Emergency urgency prioritization.

---

## 4. Data Availability Decision Gate (Section 12.4)

In accordance with `adityaImplementation.md` Section 12.4:
- Real clinical datasets with verified, ethically consented neurological diagnostic labels under webcam conditions were **not** available for deployment.
- As required by the engineering specification, we **refuse to train on fabricated or synthetic sequences and claim clinical accuracy**.
- The model status is honestly reported in the runtime schema as:
  ```json
  "temporal_model": {
    "status": "not_configured",
    "model_name": "ocutrack-tcn-experimental",
    "model_version": null,
    "output": null,
    "notes": [
      "Temporal TCN model is not configured for production clinical use.",
      "No disease probability or diagnostic claim is produced."
    ]
  }
  ```
- An experimental checkpoint path is provided for engineering benchmarking and unit testing only.

---

## 5. Subject-Level Evaluation Protocol & Leakage Prevention

- **Split Rule:** All recordings from an individual participant must be assigned strictly to a single partition (`train`, `val`, or `test`) using `GroupShuffleSplit` / `GroupKFold`.
- **Baseline Comparison:** Compared against a transparent `StatisticalBaseline` (logistic regression on summary features) evaluated on the exact same held-out subjects.
- **Evaluation Metrics:** Evaluated using precision, recall, macro F1, and confusion matrix. Accuracy alone is never used as the sole evaluation metric.
