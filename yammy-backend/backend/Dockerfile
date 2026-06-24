FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/app/model_cache \
    CUDA_VISIBLE_DEVICES="" \
    TF_CPP_MIN_LOG_LEVEL=2

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir tensorflow-cpu \
    && pip install --no-cache-dir --prefer-binary -r requirements.txt \
    && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu --force-reinstall --no-deps

COPY . .
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
