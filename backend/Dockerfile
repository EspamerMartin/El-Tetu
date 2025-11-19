FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip wheel && \
    pip install --no-cache-dir 'setuptools>=65.0.0,<81.0.0' && \
    pip install --no-cache-dir -r requirements.txt

RUN useradd -m -u 1000 appuser

COPY --chown=appuser:appuser . /app/

RUN mkdir -p /app/staticfiles /app/media /app/logs && \
    chown -R appuser:appuser /app && \
    chmod +x /app/entrypoint.sh

USER appuser

CMD ["/app/entrypoint.sh"]
