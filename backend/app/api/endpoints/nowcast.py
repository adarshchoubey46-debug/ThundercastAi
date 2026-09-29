from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from app.schemas.weather import LocationNowcast
from app.data.generator import BHOPAL_LOCATIONS, generate_bhopal_observation
from app.ml.nowcaster import XGBoostNowcaster

router = APIRouter()
nowcaster = XGBoostNowcaster()

@router.get("/nowcast", response_model=List[LocationNowcast])
def get_all_nowcasts():
    now = datetime.utcnow()
    results = []
    for loc in BHOPAL_LOCATIONS:
        obs = generate_bhopal_observation(loc, now, storm_phase=0.70)
        results.append(nowcaster.predict_location(obs))
    return results

@router.get("/nowcast/{location_name}", response_model=LocationNowcast)
def get_location_nowcast(location_name: str):
    now = datetime.utcnow()
    # Case insensitive search across stations
    matched_loc = next(
        (loc for loc in BHOPAL_LOCATIONS if location_name.lower() in loc.location_name.lower()),
        None
    )
    if not matched_loc:
        raise HTTPException(
            status_code=404,
            detail=f"Location '{location_name}' not found. Available locations: Bhopal Central, Bairagarh, Kolar Road, Arera Colony, Upper Lake, Mandideep."
        )
    obs = generate_bhopal_observation(matched_loc, now, storm_phase=0.75)
    return nowcaster.predict_location(obs)
