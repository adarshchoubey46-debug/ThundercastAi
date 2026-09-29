from datetime import datetime
from app.data.generator import BHOPAL_LOCATIONS, generate_bhopal_observation
from app.ml.feature_engineering import FeatureExtractor
from app.ml.persistence_baseline import PersistenceBaselineNowcaster
from app.ml.nowcaster import XGBoostNowcaster

def test_feature_engineering_null_handling():
    obs = generate_bhopal_observation(BHOPAL_LOCATIONS[0], datetime.utcnow())
    # Force CAPE and dew_point to None to verify non-fabrication rule
    obs.cape_jkg = None
    obs.dew_point_c = None
    
    features = FeatureExtractor.extract_features(obs)
    assert features["cape_jkg"] is None
    assert features["dew_point_depression_c"] is None

def test_persistence_baseline():
    obs = generate_bhopal_observation(BHOPAL_LOCATIONS[0], datetime.utcnow(), storm_phase=0.8)
    baseline = PersistenceBaselineNowcaster()
    preds = baseline.predict(obs)
    
    assert len(preds) == 4
    assert preds[0].horizon_minutes == 15
    assert preds[3].horizon_minutes == 60

def test_xgboost_nowcaster():
    obs = generate_bhopal_observation(BHOPAL_LOCATIONS[0], datetime.utcnow(), storm_phase=0.8)
    nowcaster = XGBoostNowcaster()
    result = nowcaster.predict_location(obs)
    
    assert result.source_name == "Operational_Nowcast_Engine"
    assert result.source_type == "MODEL_PREDICTION"
    assert len(result.predictions) == 4
    assert result.predictions[0].thunderstorm_probability >= 0.0
