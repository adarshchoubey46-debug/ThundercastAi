from fastapi import APIRouter
from typing import List
from datetime import datetime
from app.schemas.weather import AtmosphericObservation
from app.data.generator import BHOPAL_LOCATIONS, generate_bhopal_observation

router = APIRouter()

@router.get("/observations", response_model=List[AtmosphericObservation])
def get_observations():
    now = datetime.utcnow()
    # Returns latest atmospheric observations across Bhopal stations
    return [
        generate_bhopal_observation(loc, now, storm_phase=0.65)
        for loc in BHOPAL_LOCATIONS
    ]
