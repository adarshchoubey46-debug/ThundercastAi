from fastapi import APIRouter
from typing import List
from datetime import datetime
from time import perf_counter
from app.schemas.weather import AtmosphericObservation
from app.data.generator import BHOPAL_LOCATIONS, generate_bhopal_observation
from app.data.feed_health import record_observation_failure, record_observation_success

router = APIRouter()

@router.get("/observations", response_model=List[AtmosphericObservation])
def get_observations():
    started = perf_counter()
    now = datetime.utcnow()
    # Returns latest atmospheric observations across Bhopal stations
    try:
        observations = [
            generate_bhopal_observation(loc, now, storm_phase=0.65)
            for loc in BHOPAL_LOCATIONS
        ]
        record_observation_success(observations, (perf_counter() - started) * 1000)
        return observations
    except Exception as error:
        record_observation_failure(error)
        raise
