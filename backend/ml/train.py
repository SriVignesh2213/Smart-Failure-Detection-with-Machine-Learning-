import os
import sys
import pandas as pd
import numpy as np
import joblib
import logging

from sklearn.model_selection import train_test_split, KFold, cross_validate
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

# Import the 13 required classifiers
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, AdaBoostClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

try:
    from lightgbm import LGBMClassifier
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

try:
    from catboost import CatBoostClassifier
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False


# Multi-output classifier for secondary predictions
from sklearn.multioutput import MultiOutputClassifier

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ml_training")

def clean_and_preprocess_data(df):
    """
    Cleans and preprocesses the dataset.
    Features: Type, Air temperature, Process temperature, Rotational speed, Torque, Tool wear.
    Target: Machine failure.
    Secondary targets: TWF, HDF, PWF, OSF, RNF.
    """
    logger.info("Cleaning and preprocessing dataset...")
    
    # Check for missing values (impute with median if any exist)
    if df.isnull().sum().sum() > 0:
        logger.warning("Missing values found, imputing...")
        for col in df.columns:
            if df[col].dtype in [np.float64, np.int64]:
                df[col] = df[col].fillna(df[col].median())
            else:
                df[col] = df[col].fillna(df[col].mode()[0])
    
    # Rename columns for convenience
    df = df.rename(columns={
        "Type": "product_type",
        "Air temperature": "air_temp",
        "Process temperature": "process_temp",
        "Rotational speed": "rotational_speed",
        "Torque": "torque",
        "Tool wear": "tool_wear",
        "Machine failure": "machine_failure"
    })
    
    # Detect outliers in numerical columns using IQR and log them
    num_cols = ["air_temp", "process_temp", "rotational_speed", "torque", "tool_wear"]
    outliers_summary = {}
    for col in num_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        outliers_summary[col] = len(outliers)
    
    logger.info(f"Outliers detected by IQR: {outliers_summary}")
    
    # Return processed dataframe
    return df

def get_models():
    """Returns a dictionary of the 13 required models with default settings."""
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Random Forest": RandomForestClassifier(random_state=42),
        "Extra Trees": ExtraTreesClassifier(random_state=42),
        "Support Vector Machine": SVC(probability=True, random_state=42),
        "K-Nearest Neighbors": KNeighborsClassifier(),
        "Naive Bayes": GaussianNB(),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42),
        "AdaBoost": AdaBoostClassifier(random_state=42),
        "Multi Layer Perceptron": MLPClassifier(max_iter=500, random_state=42)
    }
    
    if HAS_XGBOOST:
        models["XGBoost"] = XGBClassifier(use_label_encoder=False, eval_metric="logloss", random_state=42)
    else:
        logger.warning("XGBoost not available; skipping in comparison.")
        
    if HAS_LIGHTGBM:
        models["LightGBM"] = LGBMClassifier(random_state=42, verbose=-1)
    else:
        logger.warning("LightGBM not available; skipping in comparison.")
        
    if HAS_CATBOOST:
        models["CatBoost"] = CatBoostClassifier(random_state=42, verbose=0)
    else:
        logger.warning("CatBoost not available; skipping in comparison.")
        
    return models

def main():
    # Define file paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/
    dataset_path = os.path.join(os.path.dirname(base_dir), "predictive_maintenance.csv")
    
    if not os.path.exists(dataset_path):
        logger.error(f"Dataset not found at {dataset_path}")
        sys.exit(1)
        
    # Load dataset
    df_raw = pd.read_csv(dataset_path)
    df = clean_and_preprocess_data(df_raw)
    
    # Feature columns and target
    feature_cols = ["product_type", "air_temp", "process_temp", "rotational_speed", "torque", "tool_wear"]
    X = df[feature_cols]
    y = df["machine_failure"]
    
    # Failure types columns (for secondary multi-label classification)
    failure_type_cols = ["TWF", "HDF", "PWF", "OSF", "RNF"]
    y_failure_types = df[failure_type_cols]
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Secondary dataset for failure types (only trained on positive failure cases to specify cause,
    # or on all cases. Training on all cases helps model learn when failure types occur)
    X_train_ft, X_test_ft, y_train_ft, y_test_ft = train_test_split(
        X, y_failure_types, test_size=0.2, random_state=42, stratify=y
    )
    
    # Preprocessor definition
    numeric_features = ["air_temp", "process_temp", "rotational_speed", "torque", "tool_wear"]
    categorical_features = ["product_type"]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
        ]
    )
    
    # Preprocess training and testing data for model comparisons
    X_train_preprocessed = preprocessor.fit_transform(X_train)
    X_test_preprocessed = preprocessor.transform(X_test)
    
    # Train and compare multiple models
    models = get_models()
    results = []
    
    logger.info("Starting model evaluation & comparison...")
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    
    for name, model in models.items():
        logger.info(f"Evaluating {name}...")
        
        # Fit model on training data
        model.fit(X_train_preprocessed, y_train)
        
        # Predict
        y_pred = model.predict(X_test_preprocessed)
        y_prob = model.predict_proba(X_test_preprocessed)[:, 1] if hasattr(model, "predict_proba") else y_pred
        
        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test, y_prob)
        
        results.append({
            "Model": name,
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "F1 Score": f1,
            "ROC AUC": roc_auc
        })
        
    # Print metrics table
    results_df = pd.DataFrame(results).sort_values(by="F1 Score", ascending=False)
    print("\n" + "="*80)
    print("MODEL COMPARISON (SORTED BY F1 SCORE)")
    print("="*80)
    print(results_df.to_string(index=False))
    print("="*80 + "\n")
    
    # Auto-select the best model based on F1 Score
    best_model_name = results_df.iloc[0]["Model"]
    logger.info(f"Auto-selected best binary classifier: {best_model_name}")
    
    # Get the best model
    best_estimator = models[best_model_name]
    
    # We will build a pipeline for final inference containing the preprocessor and the estimator
    clf_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", best_estimator)
    ])
    
    # Train final binary pipeline
    logger.info("Training final binary model pipeline...")
    clf_pipeline.fit(X_train, y_train)
    
    # Evaluate final pipeline on test set
    y_pred_final = clf_pipeline.predict(X_test)
    y_prob_final = clf_pipeline.predict_proba(X_test)[:, 1]
    
    logger.info(f"Final Model ({best_model_name}) Performance:")
    logger.info(f"F1 Score: {f1_score(y_test, y_pred_final):.4f}")
    logger.info(f"Recall: {recall_score(y_test, y_pred_final):.4f}")
    logger.info(f"Precision: {precision_score(y_test, y_pred_final):.4f}")
    logger.info(f"Accuracy: {accuracy_score(y_test, y_pred_final):.4f}")
    logger.info(f"Confusion Matrix:\n{confusion_matrix(y_test, y_pred_final)}")
    
    # Train failure type classifier
    logger.info("Training secondary failure type classifier...")
    # Preprocess data for multi-output
    preprocessor_ft = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
        ]
    )
    
    # We use a MultiOutput Random Forest model for classifying specific failure modes
    base_forest = RandomForestClassifier(n_estimators=150, random_state=42)
    multi_output_clf = MultiOutputClassifier(base_forest)
    
    ft_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor_ft),
        ("classifier", multi_output_clf)
    ])
    
    ft_pipeline.fit(X_train_ft, y_train_ft)
    
    # Evaluate failure type classification
    y_pred_ft = ft_pipeline.predict(X_test_ft)
    logger.info("Failure Type Classifier trained successfully.")
    
    # Create directory for model files
    models_dir = os.path.join(base_dir, "app", "ml", "models")
    os.makedirs(models_dir, exist_ok=True)
    
    # Save the models
    binary_model_path = os.path.join(models_dir, "best_model.joblib")
    failure_type_model_path = os.path.join(models_dir, "failure_type_model.joblib")
    
    joblib.dump(clf_pipeline, binary_model_path)
    joblib.dump(ft_pipeline, failure_type_model_path)
    
    # Save training dataset summary/sample for SHAP explanation reference (approx 100 rows is good for SHAP baseline)
    shap_background_path = os.path.join(models_dir, "shap_background.joblib")
    # Store clean background sample
    background_sample = X_train.sample(100, random_state=42)
    joblib.dump(background_sample, shap_background_path)
    
    # Log model outputs
    logger.info(f"Models successfully saved to {models_dir}")
    
    # Save summary stats for UI/Dashboard usage
    metrics_summary = {
        "model_name": best_model_name,
        "accuracy": accuracy_score(y_test, y_pred_final),
        "precision": precision_score(y_test, y_pred_final, zero_division=0),
        "recall": recall_score(y_test, y_pred_final, zero_division=0),
        "f1_score": f1_score(y_test, y_pred_final, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_prob_final)
    }
    joblib.dump(metrics_summary, os.path.join(models_dir, "metrics_summary.joblib"))
    logger.info("Metrics summary written to metrics_summary.joblib.")

if __name__ == "__main__":
    main()
