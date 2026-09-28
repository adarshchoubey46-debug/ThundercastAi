from fastapi import APIRouter
from typing import List, Dict, Any
from app.data.generator import generate_historical_replay_sequence

router = APIRouter()

@router.get("/history", response_model=List[Dict[str, Any]])
def get_historical_replay():
    # Returns 12 five-minute frames of a Bhopal monsoon thunderstorm sequence
    return generate_historical_replay_sequence(num_steps=12)
