"""Anomaly detection package for electricity consumption monitoring."""
from .detector import ElectricityAnomalyDetector, run_pipeline

__all__ = ['ElectricityAnomalyDetector', 'run_pipeline']
