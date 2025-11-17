# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /app/

# Create staticfiles directory
RUN mkdir -p /app/staticfiles

# Expose port
EXPOSE 8000

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Running database migrations..."\n\
python manage.py migrate --noinput\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput\n\
echo "Creating initial users..."\n\
python init_users.py || echo "Users may already exist, continuing..."\n\
# Ensure PORT is set (Railway provides this, fallback to 8000)\n\
export PORT=${PORT:-8000}\n\
echo "Starting Gunicorn server on 0.0.0.0:$PORT..."\n\
exec gunicorn config.wsgi:application \\\n\
  --bind 0.0.0.0:$PORT \\\n\
  --workers 3 \\\n\
  --log-level info \\\n\
  --access-logfile - \\\n\
  --error-logfile -\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Run entrypoint script
CMD ["/app/entrypoint.sh"]
