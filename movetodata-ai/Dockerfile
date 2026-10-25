FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for pandas/openpyxl/pdfplumber
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Non-root user for security
# Créer les répertoires RAG avant le chown pour que les named volumes
# soient initialisés avec appuser comme propriétaire
RUN useradd -m -u 1001 appuser && \
    mkdir -p /app/rag/catalog /app/rag/docs && \
    chown -R appuser /app
USER appuser

EXPOSE 8090

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"]
