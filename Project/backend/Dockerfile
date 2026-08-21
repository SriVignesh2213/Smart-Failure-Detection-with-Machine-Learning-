FROM python:3.13-slim

WORKDIR /app

# Install system build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and dataset
COPY . /app/backend
COPY predictive_maintenance.csv /app/predictive_maintenance.csv

WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Train ML models during container build or startup if missing, then start Uvicorn
CMD ["sh", "-c", "python ml/train.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
