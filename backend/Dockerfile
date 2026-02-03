# --- STAGE 1: Builder ---
# This stage builds a virtual environment with all dependencies.
FROM python:3.11-slim as builder

# Install system dependencies & Poetry
RUN apt-get update && apt-get install -y build-essential curl git procps && rm -rf /var/lib/apt/lists/*
RUN pip install poetry

# Set up a non-root user for security
RUN useradd --create-home appuser
WORKDIR /home/appuser

# Copy only the dependency file to leverage Docker cache
COPY --chown=appuser:appuser pyproject.toml ./

# Create the virtual environment and install dependencies
# --no-interaction and --no-ansi prevent prompts and color codes in logs
# --no-root prevents installing the project itself, we only want the dependencies
RUN poetry config virtualenvs.in-project true && \
    poetry install --no-interaction --no-ansi --no-root

# --- STAGE 2: Production ---
# This stage uses the virtual environment from the builder stage
FROM python:3.11-slim as production

# Set up the same non-root user
RUN useradd --create-home appuser
USER appuser
WORKDIR /home/appuser

# Copy the virtual environment from the builder stage
COPY --from=builder --chown=appuser:appuser /home/appuser/.venv ./.venv

# Copy the application source code
COPY --chown=appuser:appuser . .

# Activate the virtual environment by adding it to the PATH
ENV PATH="/home/appuser/.venv/bin:$PATH"

# Expose Port and start the application
EXPOSE 8000
# CMD is now explicit to ensure it uses the venv
CMD ["/home/appuser/.venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
