# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Metadata labels
LABEL maintainer="El-Tetu Team" \
      description="El-Tetu Backend API - Django REST Framework"

# Set work directory
WORKDIR /app

# Install system dependencies
# NOTA: psycopg2-binary ya viene precompilado, solo necesitamos libpq-dev
# postgresql-client no es necesario (solo se usa psql, que no se ejecuta en el contenedor)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Copiar requirements primero para aprovechar cache de Docker
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip wheel && \
    pip install --no-cache-dir 'setuptools>=65.0.0,<81.0.0' && \
    pip install --no-cache-dir -r requirements.txt

# Create non-root user for security
RUN useradd -m -u 1000 appuser

# Copy project files
COPY --chown=appuser:appuser . /app/

# Create directories and set permissions (como root antes de cambiar usuario)
RUN mkdir -p /app/staticfiles /app/media /app/logs && \
    chown -R appuser:appuser /app && \
    chmod +x /app/entrypoint.sh

# Switch to non-root user
USER appuser

# Expose port (Railway usa variable PORT, esto es solo documentación)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import os, urllib.request; port=os.environ.get('PORT', '8000'); urllib.request.urlopen(f'http://localhost:{port}/health/')" || exit 1

# Run entrypoint script
CMD ["/app/entrypoint.sh"]
