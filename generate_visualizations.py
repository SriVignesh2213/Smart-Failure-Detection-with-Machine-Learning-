import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import roc_curve, auc, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Import ML Models
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, AdaBoostClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

try:
    from catboost import CatBoostClassifier
    HAS_CAT = True
except ImportError:
    HAS_CAT = False

import shap

# Set Dark Industrial Theme for Matplotlib
plt.style.use('dark_background')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#334155'
plt.rcParams['axes.linewidth'] = 1.2
plt.rcParams['grid.color'] = '#1E293B'
plt.rcParams['grid.linestyle'] = '--'

# Create output folder
output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "visualizations")
os.makedirs(output_dir, exist_ok=True)
print(f"Visualizations will be saved to: {output_dir}")

# Load Dataset
dataset_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "predictive_maintenance.csv")
df = pd.read_csv(dataset_path)

# Clean & rename columns
df = df.rename(columns={
    "Type": "product_type",
    "Air temperature": "air_temp",
    "Process temperature": "process_temp",
    "Rotational speed": "rotational_speed",
    "Torque": "torque",
    "Tool wear": "tool_wear",
    "Machine failure": "machine_failure"
})

# Feature engineering for visualization
df["temp_difference"] = df["process_temp"] - df["air_temp"]
df["power_kw"] = df["torque"] * df["rotational_speed"] * (2 * np.pi / 60) / 1000

# ---------------------------------------------------------
# 1. Feature Correlation Matrix Heatmap
# ---------------------------------------------------------
plt.figure(figsize=(10, 8), dpi=300)
corr_cols = ["air_temp", "process_temp", "temp_difference", "rotational_speed", "torque", "tool_wear", "power_kw", "machine_failure"]
corr = df[corr_cols].corr()

mask = np.triu(np.ones_like(corr, dtype=bool))
cmap = sns.diverging_palette(220, 10, as_cmap=True)

ax = sns.heatmap(
    corr, 
    mask=mask, 
    cmap="coolwarm", 
    vmax=.8, 
    center=0,
    square=True, 
    linewidths=.8, 
    cbar_kws={"shrink": .8},
    annot=True, 
    fmt=".2f",
    annot_kws={"size": 9, "weight": "bold"}
)

plt.title("Industrial Telemetry Feature Correlation Matrix", fontsize=14, fontweight="bold", pad=15, color="#06B6D4")
plt.tight_layout()
corr_path = os.path.join(output_dir, "correlation_matrix.png")
plt.savefig(corr_path, dpi=300, bbox_inches="tight")
plt.close()
print(f"Saved: {corr_path}")

# ---------------------------------------------------------
# 2. Sensor Telemetry Feature Distributions (Failure vs Healthy)
# ---------------------------------------------------------
fig, axes = plt.subplots(2, 3, figsize=(16, 10), dpi=300)
fig.suptitle("Sensor Telemetry Distributions by Machine Operational Health", fontsize=16, fontweight="bold", color="#06B6D4", y=0.98)

features_to_plot = [
    ("air_temp", "Air Temperature (K)"),
    ("process_temp", "Process Temperature (K)"),
    ("temp_difference", "Temp Difference (K)"),
    ("rotational_speed", "Rotational Speed (RPM)"),
    ("torque", "Torque (Nm)"),
    ("tool_wear", "Tool Wear (min)")
]

for idx, (col, label) in enumerate(features_to_plot):
    r, c = idx // 3, idx % 3
    sns.kdeplot(data=df, x=col, hue="machine_failure", common_norm=False, palette=["#10B981", "#EF4444"], fill=True, alpha=0.3, ax=axes[r, c], linewidth=2)
    axes[r, c].set_title(label, fontsize=11, fontweight="bold", color="#E2E8F0")
    axes[r, c].set_xlabel("")
    axes[r, c].set_ylabel("Density", fontsize=9, color="#94A3B8")
    axes[r, c].grid(True, alpha=0.3)

plt.tight_layout(rect=[0, 0, 1, 0.95])
dist_path = os.path.join(output_dir, "sensor_distributions.png")
plt.savefig(dist_path, dpi=300, bbox_inches="tight")
plt.close()
print(f"Saved: {dist_path}")

# ---------------------------------------------------------
# 3. Failure Modes Breakdown
# ---------------------------------------------------------
plt.figure(figsize=(10, 6), dpi=300)
failure_modes = ["TWF", "HDF", "PWF", "OSF", "RNF"]
failure_counts = [df[fm].sum() for fm in failure_modes]
failure_names = ["Tool Wear (TWF)", "Heat Dissipation (HDF)", "Power Failure (PWF)", "Overstrain (OSF)", "Random Failure (RNF)"]

bars = plt.barh(failure_names, failure_counts, color=["#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#8B5CF6"], edgecolor="#1E293B", height=0.6)

for bar in bars:
    width = bar.get_width()
    plt.text(width + 2, bar.get_y() + bar.get_height()/2, f"{int(width)} cases", ha="left", va="center", fontsize=10, fontweight="bold", color="#F8FAFC")

plt.title("Failure Mode Distribution in AI4I Dataset", fontsize=14, fontweight="bold", pad=15, color="#F59E0B")
plt.xlabel("Occurrences Count", fontsize=11, color="#94A3B8")
plt.grid(axis="x", alpha=0.3)
plt.xlim(0, max(failure_counts) * 1.25)
plt.tight_layout()
fm_path = os.path.join(output_dir, "failure_types_distribution.png")
plt.savefig(fm_path, dpi=300, bbox_inches="tight")
plt.close()
print(f"Saved: {fm_path}")

# ---------------------------------------------------------
# Train Models & Benchmark Visualizations
# ---------------------------------------------------------
feature_cols = ["product_type", "air_temp", "process_temp", "rotational_speed", "torque", "tool_wear"]
X = df[feature_cols]
y = df["machine_failure"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), ["air_temp", "process_temp", "rotational_speed", "torque", "tool_wear"]),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["product_type"])
    ]
)

X_train_prep = preprocessor.fit_transform(X_train)
X_test_prep = preprocessor.transform(X_test)

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

if HAS_XGB: models["XGBoost"] = XGBClassifier(use_label_encoder=False, eval_metric="logloss", random_state=42)
if HAS_LGB: models["LightGBM"] = LGBMClassifier(random_state=42, verbose=-1)
if HAS_CAT: models["CatBoost"] = CatBoostClassifier(random_state=42, verbose=0)

benchmark_data = []
fitted_models = {}

plt.figure(figsize=(10, 8), dpi=300)

for name, model in models.items():
    model.fit(X_train_prep, y_train)
    fitted_models[name] = model
    
    y_pred = model.predict(X_test_prep)
    y_prob = model.predict_proba(X_test_prep)[:, 1] if hasattr(model, "predict_proba") else y_pred
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)
    
    benchmark_data.append({
        "Model": name, "Accuracy": acc, "Precision": prec, "Recall": rec, "F1 Score": f1, "ROC AUC": roc_auc
    })
    
    # Plot ROC Curve for top performers
    if name in ["LightGBM", "XGBoost", "CatBoost", "Gradient Boosting", "Random Forest", "Decision Tree"]:
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        plt.plot(fpr, tpr, lw=2, label=f'{name} (AUC = {roc_auc:.3f})')

plt.plot([0, 1], [0, 1], color='#64748B', lw=1.5, linestyle='--', label='Random Chance')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate (1 - Specificity)', fontsize=11, color='#94A3B8')
plt.ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=11, color='#94A3B8')
plt.title('Multi-Model ROC Curve & AUC Performance Benchmark', fontsize=14, fontweight='bold', pad=15, color='#06B6D4')
plt.legend(loc="lower right", frameon=True, facecolor="#0F172A", edgecolor="#334155", fontsize=9)
plt.grid(True, alpha=0.3)
plt.tight_layout()
roc_path = os.path.join(output_dir, "roc_auc_curves.png")
plt.savefig(roc_path, dpi=300, bbox_inches="tight")
plt.close()
print(f"Saved: {roc_path}")

# ---------------------------------------------------------
# 4. Model Benchmark Comparison Bar Chart
# ---------------------------------------------------------
benchmark_df = pd.DataFrame(benchmark_data).sort_values(by="F1 Score", ascending=True)

plt.figure(figsize=(12, 8), dpi=300)
bar_width = 0.35
y_positions = np.arange(len(benchmark_df))

plt.barh(y_positions - bar_width/2, benchmark_df["F1 Score"], height=bar_width, label="F1 Score", color="#06B6D4", edgecolor="#1E293B")
plt.barh(y_positions + bar_width/2, benchmark_df["ROC AUC"], height=bar_width, label="ROC AUC", color="#10B981", edgecolor="#1E293B")

plt.yticks(y_positions, benchmark_df["Model"], fontsize=10, fontweight="bold")
plt.xlabel("Metric Score (0.0 - 1.0)", fontsize=11, color="#94A3B8")
plt.title("ML Models Evaluation Metric Comparison (F1-Score & ROC-AUC)", fontsize=14, fontweight="bold", pad=15, color="#06B6D4")
plt.legend(loc="lower right", frameon=True, facecolor="#0F172A", edgecolor="#334155")
plt.grid(axis="x", alpha=0.3)
plt.xlim(0.0, 1.05)

for i, (f1, auc_val) in enumerate(zip(benchmark_df["F1 Score"], benchmark_df["ROC AUC"])):
    plt.text(f1 + 0.01, i - bar_width/2, f"{f1:.2f}", va="center", fontsize=8, color="#06B6D4", fontweight="bold")
    plt.text(auc_val + 0.01, i + bar_width/2, f"{auc_val:.2f}", va="center", fontsize=8, color="#10B981", fontweight="bold")

plt.tight_layout()
benchmark_path = os.path.join(output_dir, "model_benchmark_comparison.png")
plt.savefig(benchmark_path, dpi=300, bbox_inches="tight")
plt.close()
print(f"Saved: {benchmark_path}")

# ---------------------------------------------------------
# 5. Confusion Matrix for Best Model (LightGBM or Best in benchmark)
# ---------------------------------------------------------
best_model_name = benchmark_df.iloc[-1]["Model"]
best_model = fitted_models[best_model_name]

y_pred_best = best_model.predict(X_test_prep)
cm = confusion_matrix(y_test, y_pred_best)

plt.figure(figsize=(7, 6), dpi=300)
sns.heatmap(
    cm, 
    annot=True, 
    fmt="d", 
    cmap="Blues", 
    cbar=False,
    xticklabels=["Healthy (0)", "Failure (1)"],
    yticklabels=["Healthy (0)", "Failure (1)"],
    annot_kws={"size": 14, "weight": "bold"}
)
plt.title(f"Confusion Matrix - {best_model_name} (Top Model)", fontsize=13, fontweight="bold", pad=15, color="#06B6D4")
plt.xlabel("Predicted Label", fontsize=11, color="#94A3B8")
plt.ylabel("Actual True Label", fontsize=11, color="#94A3B8")
plt.tight_layout()
cm_path = os.path.join(output_dir, "confusion_matrix_best_model.png")
plt.savefig(cm_path, dpi=300, bbox_inches="tight")
plt.close()
print(f"Saved: {cm_path}")

# ---------------------------------------------------------
# 6. Feature Importance Chart
# ---------------------------------------------------------
if hasattr(best_model, "feature_importances_"):
    importances = best_model.feature_importances_
    # Feature names after OneHotEncoding
    preprocessed_feature_names = ["Air Temp", "Process Temp", "Rotational Speed", "Torque", "Tool Wear", "Product Type L", "Product Type M", "Product Type H"]
    
    feat_imp_df = pd.DataFrame({
        "Feature": preprocessed_feature_names[:len(importances)],
        "Importance": importances
    }).sort_values(by="Importance", ascending=True)

    plt.figure(figsize=(10, 6), dpi=300)
    plt.barh(feat_imp_df["Feature"], feat_imp_df["Importance"], color="#06B6D4", edgecolor="#1E293B", height=0.5)
    plt.title(f"Feature Importances ({best_model_name})", fontsize=14, fontweight="bold", pad=15, color="#06B6D4")
    plt.xlabel("Relative Importance Score", fontsize=11, color="#94A3B8")
    plt.grid(axis="x", alpha=0.3)
    plt.tight_layout()
    fi_path = os.path.join(output_dir, "feature_importance.png")
    plt.savefig(fi_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved: {fi_path}")

# ---------------------------------------------------------
# 7. SHAP Summary Plot
# ---------------------------------------------------------
try:
    plt.figure(figsize=(10, 6), dpi=300)
    background_sample = X_train_prep[:100]
    
    def predict_wrapper(x):
        return best_model.predict_proba(x)[:, 1]

    explainer = shap.Explainer(predict_wrapper, background_sample)
    shap_vals = explainer(X_test_prep[:100])

    feature_labels = ["Air Temp", "Process Temp", "Rotational Speed", "Torque", "Tool Wear", "Type L", "Type M", "Type H"][:X_test_prep.shape[1]]
    
    shap.summary_plot(shap_vals.values, X_test_prep[:100], feature_names=feature_labels, show=False)
    plt.title("SHAP Feature Impact Summary on Machine Failure Risk", fontsize=14, fontweight="bold", pad=15, color="#06B6D4")
    plt.tight_layout()
    shap_path = os.path.join(output_dir, "shap_summary_waterfall.png")
    plt.savefig(shap_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved: {shap_path}")
except Exception as e:
    print(f"SHAP plot warning: {e}")

print("All high-resolution visualizations successfully generated in 'visualizations/' directory.")
