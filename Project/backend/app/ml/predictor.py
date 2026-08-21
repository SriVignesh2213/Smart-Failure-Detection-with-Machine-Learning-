import os
import joblib
import pandas as pd
import numpy as np
import shap
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger("app.ml.predictor")

class MachineFailurePredictor:
    def __init__(self):
        self.binary_model = None
        self.failure_type_model = None
        self.shap_background = None
        self.metrics_summary = None
        self.explainer = None
        self.is_loaded = False
        
        self.load_models()

    def load_models(self):
        """Loads models and background samples from joblib files."""
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # backend/
        models_dir = os.path.join(base_dir, "app", "ml", "models")
        
        binary_model_path = os.path.join(models_dir, "best_model.joblib")
        failure_type_model_path = os.path.join(models_dir, "failure_type_model.joblib")
        shap_background_path = os.path.join(models_dir, "shap_background.joblib")
        metrics_summary_path = os.path.join(models_dir, "metrics_summary.joblib")

        try:
            if os.path.exists(binary_model_path):
                self.binary_model = joblib.load(binary_model_path)
                logger.info("Loaded binary classifier model.")
                
            if os.path.exists(failure_type_model_path):
                self.failure_type_model = joblib.load(failure_type_model_path)
                logger.info("Loaded failure type multi-label model.")
                
            if os.path.exists(shap_background_path):
                self.shap_background = joblib.load(shap_background_path)
                logger.info("Loaded SHAP background reference data.")
                
            if os.path.exists(metrics_summary_path):
                self.metrics_summary = joblib.load(metrics_summary_path)
                logger.info("Loaded metrics summary.")
                
            if self.binary_model is not None and self.shap_background is not None:
                self.is_loaded = True
                self._initialize_shap_explainer()
        except Exception as e:
            logger.error(f"Error loading machine learning models: {e}")

    def _initialize_shap_explainer(self):
        """Initializes the SHAP Explainer using the preprocessor + model."""
        try:
            preprocessor = self.binary_model.named_steps["preprocessor"]
            model = self.binary_model.named_steps["classifier"]
            
            # Preprocess the background reference data
            self.bg_preprocessed = preprocessor.transform(self.shap_background)
            
            # Create a wrapper or explainer
            # To handle any model, we can use shap.Explainer with a custom prediction function.
            # We explain the preprocessed feature space.
            def predict_proba_wrapper(x):
                return model.predict_proba(x)[:, 1]

            # We use a KernelExplainer or generic Explainer on the preprocessed feature space
            self.explainer = shap.Explainer(predict_proba_wrapper, self.bg_preprocessed)
            logger.info("SHAP explainer initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize SHAP explainer: {e}")

    def predict(self, input_data: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, float]]:
        """
        Runs dual-stage predictions on sensor inputs and returns predictions and feature contributions.
        """
        if not self.is_loaded:
            logger.warning("Models are not loaded, running with mockup predictor.")
            return self._mock_predict(input_data)
            
        try:
            # Map request schema to ML expected columns
            # Input features: product_type, air_temp, process_temp, rotational_speed, torque, tool_wear
            input_df = pd.DataFrame([{
                "product_type": input_data["product_type"],
                "air_temp": input_data["air_temp"],
                "process_temp": input_data["process_temp"],
                "rotational_speed": input_data["rotational_speed"],
                "torque": input_data["torque"],
                "tool_wear": input_data["tool_wear"]
            }])
            
            # Primary binary prediction
            prob = float(self.binary_model.predict_proba(input_df)[0, 1])
            is_failure = bool(prob >= 0.5)
            
            # Determine health status label and confidence score
            if is_failure:
                status = "critical" if prob > 0.8 else "warning"
                confidence = prob
            else:
                status = "warning" if prob > 0.25 else "healthy"
                confidence = 1 - prob
                
            # Secondary failure type prediction (multi-label)
            failure_type = "None"
            maintenance_actions = []
            
            if is_failure and self.failure_type_model:
                ft_pred = self.failure_type_model.predict(input_df)[0]
                # Columns: TWF, HDF, PWF, OSF, RNF
                labels = ["Tool Wear Failure (TWF)", "Heat Dissipation Failure (HDF)", 
                          "Power Failure (PWF)", "Overstrain Failure (OSF)", "Random Failure (RNF)"]
                
                active_types = [labels[i] for i, val in enumerate(ft_pred) if val == 1]
                
                if active_types:
                    failure_type = ", ".join(active_types)
                else:
                    failure_type = "Other/Unexplained Failure"
                    
                # Build maintenance recommendations based on failure flags
                if ft_pred[0] == 1: # TWF
                    maintenance_actions.append("Tool wear limit exceeded. Replace cutting tool inserts immediately.")
                if ft_pred[1] == 1: # HDF
                    maintenance_actions.append("Heat dissipation issue. Check coolant level, radiator cleanliness, and fans.")
                if ft_pred[2] == 1: # PWF
                    maintenance_actions.append("Power load failure. Verify supply voltage, motor cables, and power limits.")
                if ft_pred[3] == 1: # OSF
                    maintenance_actions.append("Overstrain detected. Reduce operating load/torque or rotational speed.")
                if ft_pred[4] == 1: # RNF
                    maintenance_actions.append("Random failure flagged. Run a full diagnostic check on sensor alignments.")
                
            if not maintenance_actions:
                if is_failure:
                    maintenance_actions.append("Machine failure predicted. Shut down machine and schedule maintenance inspection.")
                else:
                    maintenance_actions.append("No immediate maintenance action required. Monitor telemetry.")

            maintenance_action = " ".join(maintenance_actions)
            
            # Calculate SHAP explainability
            shap_contributions = self._compute_shap_contributions(input_df)
            
            result = {
                "failure_probability": prob,
                "is_failure": is_failure,
                "status": status,
                "failure_type": failure_type,
                "confidence_score": confidence,
                "maintenance_action": maintenance_action
            }
            
            return result, shap_contributions
            
        except Exception as e:
            logger.error(f"Error executing machine failure prediction: {e}")
            return self._mock_predict(input_data)

    def _compute_shap_contributions(self, input_df: pd.DataFrame) -> Dict[str, float]:
        """Computes feature contributions to the prediction using SHAP."""
        feature_names = ["air_temp", "process_temp", "rotational_speed", "torque", "tool_wear", "product_type"]
        default_contribs = {feat: 0.0 for feat in feature_names}
        
        if self.explainer is None:
            return default_contribs
            
        try:
            preprocessor = self.binary_model.named_steps["preprocessor"]
            input_preprocessed = preprocessor.transform(input_df)
            
            # Calculate SHAP values for the instance
            shap_values = self.explainer(input_preprocessed)
            
            # Map preprocessed SHAP values back to raw feature spaces
            # Since categorical encoding (one-hot) splits product_type into product_type_H, L, M,
            # we will aggregate them back to raw features.
            raw_contributions = {feat: 0.0 for feat in feature_names}
            
            # Retrieve processed column names
            # numeric cols: air_temp (0), process_temp (1), rotational_speed (2), torque (3), tool_wear (4)
            # encoded cols: product_type_H (5), product_type_L (6), product_type_M (7) or similar.
            # Let's dynamically aggregate
            shap_array = shap_values.values[0]
            
            raw_contributions["air_temp"] = float(shap_array[0])
            raw_contributions["process_temp"] = float(shap_array[1])
            raw_contributions["rotational_speed"] = float(shap_array[2])
            raw_contributions["torque"] = float(shap_array[3])
            raw_contributions["tool_wear"] = float(shap_array[4])
            
            # Sum up product type categorical dimensions
            if len(shap_array) > 5:
                raw_contributions["product_type"] = float(np.sum(shap_array[5:]))
                
            return raw_contributions
        except Exception as e:
            logger.error(f"Error calculating SHAP contributions: {e}")
            
            # Return fallback contributions based on deviation from simple limits (heuristic fallback)
            fallback = {feat: 0.0 for feat in feature_names}
            if input_df["torque"].values[0] > 55:
                fallback["torque"] = 0.35
            if input_df["tool_wear"].values[0] > 180:
                fallback["tool_wear"] = 0.25
            if input_df["rotational_speed"].values[0] > 2200 or input_df["rotational_speed"].values[0] < 1200:
                fallback["rotational_speed"] = 0.15
            return fallback

    def _mock_predict(self, input_data: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, float]]:
        """Mock predictive analysis fallback for testing or before model is trained."""
        # Custom simple heuristic
        score = 0.05
        actions = []
        
        # Temp diff heuristic
        temp_diff = input_data["process_temp"] - input_data["air_temp"]
        if temp_diff < 8.6:
            score += 0.20
            actions.append("Heat dissipation issue suspected. Inspect cooling.")
            
        if input_data["torque"] * input_data["rotational_speed"] / 9.5488 > 9000: # high power
            score += 0.25
            actions.append("High operational power strain. Reduce workload.")
            
        if input_data["tool_wear"] > 200:
            score += 0.30
            actions.append("High tool wear. Schedule tool replacement.")
            
        if input_data["torque"] > 60:
            score += 0.15
            actions.append("Torque overload alert.")

        is_failure = score > 0.45
        status = "critical" if score > 0.70 else ("warning" if is_failure else "healthy")
        
        # Map failure types
        failure_type = "None"
        if is_failure:
            ft_labels = []
            if input_data["tool_wear"] > 200:
                ft_labels.append("Tool Wear Failure (TWF)")
            if temp_diff < 8.6:
                ft_labels.append("Heat Dissipation Failure (HDF)")
            if input_data["torque"] > 60:
                ft_labels.append("Overstrain Failure (OSF)")
            if not ft_labels:
                ft_labels.append("Power Failure (PWF)")
            failure_type = ", ".join(ft_labels)
            
        if not actions:
            actions.append("No immediate maintenance required. Standard operation.")
            
        result = {
            "failure_probability": min(score, 1.0),
            "is_failure": is_failure,
            "status": status,
            "failure_type": failure_type,
            "confidence_score": score if is_failure else (1 - score),
            "maintenance_action": " ".join(actions)
        }
        
        contributions = {
            "air_temp": 0.05 if temp_diff < 8.6 else 0.01,
            "process_temp": 0.05 if temp_diff < 8.6 else 0.01,
            "rotational_speed": 0.15 if input_data["rotational_speed"] > 2000 else 0.02,
            "torque": 0.25 if input_data["torque"] > 55 else 0.03,
            "tool_wear": 0.35 if input_data["tool_wear"] > 180 else 0.02,
            "product_type": 0.01
        }
        
        return result, contributions

# Singleton instances of the predictor
predictor_instance = MachineFailurePredictor()

def get_predictor() -> MachineFailurePredictor:
    return predictor_instance
