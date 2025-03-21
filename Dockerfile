FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app/backend

ENV PORT=8080

CMD exec gunicorn --chdir /app/backend --worker-class eventlet -w 1 -b 0.0.0.0:$PORT run:app
