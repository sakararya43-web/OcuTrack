"""Temporal Convolutional Network (TCN) architecture for ocular time-series sequences.

Implements causal dilated 1D convolutions with residual blocks, documented receptive fields,
and strictly non-leaking temporal representations.
Adheres strictly to adityaImplementation.md Section 12.3.
"""

from typing import List, Optional
import torch
import torch.nn as nn


class ChausalConv1d(nn.Module):
    """1D convolution with causal padding to ensure no future information leaks."""

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int,
        stride: int = 1,
        dilation: int = 1,
    ):
        super().__init__()
        self.padding = (kernel_size - 1) * dilation
        self.conv = nn.Conv1d(
            in_channels=in_channels,
            out_channels=out_channels,
            kernel_size=kernel_size,
            stride=stride,
            padding=self.padding,
            dilation=dilation,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, channels, seq_len)
        out = self.conv(x)
        if self.padding > 0:
            # Trim the right-hand padding to maintain causal alignment
            out = out[:, :, : -self.padding]
        return out


class TemporalBlock(nn.Module):
    """Residual block containing two dilated causal convolution layers with normalization and dropout."""

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int,
        stride: int = 1,
        dilation: int = 1,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.conv1 = ChausalConv1d(in_channels, out_channels, kernel_size, stride=stride, dilation=dilation)
        self.norm1 = nn.BatchNorm1d(out_channels)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(dropout)

        self.conv2 = ChausalConv1d(out_channels, out_channels, kernel_size, stride=stride, dilation=dilation)
        self.norm2 = nn.BatchNorm1d(out_channels)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(dropout)

        self.net = nn.Sequential(
            self.conv1,
            self.norm1,
            self.relu1,
            self.dropout1,
            self.conv2,
            self.norm2,
            self.relu2,
            self.dropout2,
        )

        self.downsample = (
            nn.Conv1d(in_channels, out_channels, 1)
            if in_channels != out_channels
            else None
        )
        self.final_relu = nn.ReLU()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = x if self.downsample is None else self.downsample(x)
        out = self.net(x)
        return self.final_relu(out + res)


class TemporalConvNet(nn.Module):
    """Full Temporal Convolutional Network with exponentially increasing dilations.

    Receptive Field Formula:
        RF = 1 + 2 * (kernel_size - 1) * sum(dilations)
    """

    def __init__(
        self,
        num_inputs: int = 3,
        num_channels: Optional[List[int]] = None,
        kernel_size: int = 3,
        dropout: float = 0.2,
        num_classes: int = 2,
    ):
        super().__init__()
        if num_channels is None:
            num_channels = [16, 32, 64]

        self.kernel_size = kernel_size
        self.num_channels = num_channels
        self.dilations = [2**i for i in range(len(num_channels))]

        layers = []
        for i in range(len(num_channels)):
            dilation_size = self.dilations[i]
            in_ch = num_inputs if i == 0 else num_channels[i - 1]
            out_ch = num_channels[i]
            layers.append(
                TemporalBlock(
                    in_channels=in_ch,
                    out_channels=out_ch,
                    kernel_size=kernel_size,
                    stride=1,
                    dilation=dilation_size,
                    dropout=dropout,
                )
            )

        self.network = nn.Sequential(*layers)
        # Pooling & Classification Head
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        self.classifier = nn.Linear(num_channels[-1], num_classes)

    @property
    def receptive_field(self) -> int:
        """Calculates theoretical receptive field in time steps."""
        return 1 + 2 * (self.kernel_size - 1) * sum(self.dilations)

    def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extracts latent temporal embedding vector of shape (batch, num_channels[-1])."""
        features = self.network(x)
        pooled = self.global_pool(features).squeeze(-1)
        return pooled

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass.

        Args:
            x: Tensor of shape (batch_size, num_inputs, sequence_length)
        Returns:
            Logits of shape (batch_size, num_classes)
        """
        emb = self.extract_features(x)
        return self.classifier(emb)
