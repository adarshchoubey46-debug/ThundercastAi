from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np
from app.schemas.weather import HorizonPrediction, LocationNowcast, GeoLocation

class DeepLearningNowcasterInterface(ABC):
    """
    Abstract Base Class defining the contract for future Deep Learning models.
    Supports future Spatiotemporal Tensor inputs (Satellite imagery, Radar grid stacks, NWP arrays).
    """

    @abstractmethod
    def model_name(self) -> str:
        """Returns model identifier (e.g. 'ConvLSTM_U-Net_v2.0')"""
        pass

    @abstractmethod
    def is_model_loaded(self) -> bool:
        """Checks if PyTorch/TensorFlow weights are loaded into memory/GPU"""
        pass

    @abstractmethod
    def predict_spatiotemporal_grid(
        self,
        radar_tensor_stack: Optional[np.ndarray], # Shape: (Time, Channels, Height, Width)
        satellite_tensor_stack: Optional[np.ndarray],
        target_location: GeoLocation
    ) -> List[HorizonPrediction]:
        """
        Executes inference over spatiotemporal tensor grids.
        Returns multi-horizon predictions for the target location.
        """
        pass


class ConvLSTMStubNowcaster(DeepLearningNowcasterInterface):
    """
    Production stub for ConvLSTM / U-Net Deep Learning Nowcaster.
    Maintains clean interface for PyTorch checkpoint loading when real grid data is linked.
    """

    def __init__(self, weights_path: Optional[str] = None):
        self.weights_path = weights_path
        self._loaded = False

    def model_name(self) -> str:
        return "ConvLSTM_Spatiotemporal_Stub_v1.0"

    def is_model_loaded(self) -> bool:
        return self._loaded

    def predict_spatiotemporal_grid(
        self,
        radar_tensor_stack: Optional[np.ndarray],
        satellite_tensor_stack: Optional[np.ndarray],
        target_location: GeoLocation
    ) -> List[HorizonPrediction]:
        if not self.is_model_loaded():
            raise NotImplementedError(
                "ConvLSTM model weights are not loaded. "
                "The system is currently operating on the active XGBoost/RandomForest baseline model."
            )
        # Placeholder for PyTorch inference pass
        return []
