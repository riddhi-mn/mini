from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import xgboost as xgb
import joblib
import os
from typing import Dict, List, Any
from datetime import datetime, timedelta
import json

app = FastAPI(title="IntelliInspect ML Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and data
current_model = None
current_dataset = None
training_metrics = {}

class TrainingRequest(BaseModel):
    trainStart: str
    trainEnd: str
    testStart: str
    testEnd: str

class PredictionRequest(BaseModel):
    features: List[float]

class SimulationRequest(BaseModel):
    simulationStart: str
    simulationEnd: str

@app.get("/")
async def root():
    return {"message": "IntelliInspect ML Service is running"}

@app.post("/train-model")
async def train_model(request: TrainingRequest):
    global current_model, current_dataset, training_metrics
    
    try:
        if current_dataset is None:
            raise HTTPException(status_code=400, detail="No dataset available. Upload dataset first.")
        
        # Filter data by date ranges
        train_start = datetime.fromisoformat(request.trainStart.replace('Z', '+00:00'))
        train_end = datetime.fromisoformat(request.trainEnd.replace('Z', '+00:00'))
        test_start = datetime.fromisoformat(request.testStart.replace('Z', '+00:00'))
        test_end = datetime.fromisoformat(request.testEnd.replace('Z', '+00:00'))
        
        # Prepare training data
        train_mask = (current_dataset['synthetic_timestamp'] >= train_start) & (current_dataset['synthetic_timestamp'] <= train_end)
        test_mask = (current_dataset['synthetic_timestamp'] >= test_start) & (current_dataset['synthetic_timestamp'] <= test_end)
        
        train_data = current_dataset[train_mask]
        test_data = current_dataset[test_mask]
        
        if len(train_data) == 0 or len(test_data) == 0:
            raise HTTPException(status_code=400, detail="No data found for specified date ranges")
        
        # Prepare features (exclude timestamp and response columns)
        feature_cols = [col for col in current_dataset.columns if col not in ['synthetic_timestamp', 'Response']]
        X_train = train_data[feature_cols].fillna(0)
        y_train = train_data['Response']
        X_test = test_data[feature_cols].fillna(0)
        y_test = test_data['Response']
        
        # Train XGBoost model
        model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        cm = confusion_matrix(y_test, y_pred)
        
        # Store model and metrics
        current_model = model
        training_metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision), 
            "recall": float(recall),
            "f1_score": float(f1),
            "confusion_matrix": cm.tolist(),
            "feature_importance": model.feature_importances_.tolist(),
            "feature_names": feature_cols
        }
        
        # Save model
        joblib.dump(model, '/tmp/model.pkl')
        
        return {
            "status": "success",
            "message": "Model trained successfully",
            "metrics": training_metrics,
            "training_samples": len(train_data),
            "test_samples": len(test_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/predict")
async def predict(request: PredictionRequest):
    global current_model
    
    if current_model is None:
        raise HTTPException(status_code=400, detail="No trained model available")
    
    try:
        # Make prediction
        features = np.array([request.features])
        prediction = current_model.predict(features)[0]
        probability = current_model.predict_proba(features)[0]
        
        return {
            "prediction": int(prediction),
            "confidence": float(max(probability)) * 100,
            "probabilities": probability.tolist()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/set-dataset")
async def set_dataset(dataset: Dict[str, Any]):
    global current_dataset
    
    try:
        # Convert dataset to DataFrame
        df = pd.DataFrame(dataset['data'])
        
        # Convert synthetic_timestamp to datetime
        df['synthetic_timestamp'] = pd.to_datetime(df['synthetic_timestamp'])
        
        current_dataset = df
        
        return {
            "status": "success",
            "message": "Dataset loaded successfully",
            "shape": df.shape
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset loading failed: {str(e)}")

@app.get("/simulation/{simulation_start}/{simulation_end}")
async def get_simulation_data(simulation_start: str, simulation_end: str):
    global current_dataset, current_model
    
    if current_dataset is None or current_model is None:
        raise HTTPException(status_code=400, detail="Dataset and model required for simulation")
    
    try:
        # Parse dates
        start_date = datetime.fromisoformat(simulation_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(simulation_end.replace('Z', '+00:00'))
        
        # Filter simulation data
        sim_mask = (current_dataset['synthetic_timestamp'] >= start_date) & (current_dataset['synthetic_timestamp'] <= end_date)
        sim_data = current_dataset[sim_mask].copy()
        
        if len(sim_data) == 0:
            raise HTTPException(status_code=400, detail="No data found for simulation period")
        
        # Prepare features
        feature_cols = [col for col in current_dataset.columns if col not in ['synthetic_timestamp', 'Response']]
        X_sim = sim_data[feature_cols].fillna(0)
        
        # Make predictions
        predictions = current_model.predict(X_sim)
        probabilities = current_model.predict_proba(X_sim)[:, 1]
        
        # Prepare response data
        results = []
        for i, row in sim_data.iterrows():
            results.append({
                "timestamp": row['synthetic_timestamp'].isoformat(),
                "sample_id": i,
                "prediction": int(predictions[i]),
                "confidence": float(probabilities[i]) * 100,
                "actual": int(row['Response']) if 'Response' in row else None,
                "features": X_sim.iloc[i].to_dict()
            })
        
        return {
            "status": "success",
            "data": results,
            "total_samples": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)