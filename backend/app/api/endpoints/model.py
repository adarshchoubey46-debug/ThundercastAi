from fastapi import APIRouter
from app.schemas.weather import ModelPerformanceMetrics
from app.ml.metrics import MetricsEvaluator

router = APIRouter()

@router.get("/model/metrics", response_model=ModelPerformanceMetrics)
def get_model_metrics():
    return MetricsEvaluator.get_benchmark_metrics()
