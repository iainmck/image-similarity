# Based on https://pythonspeed.com/articles/conda-docker-image-size/

# The build-stage image:
FROM continuumio/miniconda3:24.1.2-0 AS build

# Create conda environment
COPY ./deployment/environment.yaml .
RUN conda env create -f environment.yaml

# Activate the conda environment
ENV PATH=/opt/conda/envs/server/bin:$PATH
RUN /bin/bash -c "source activate server"

# Install conda-pack:
RUN conda install -c conda-forge conda-pack

# Use conda-pack to create a standalone environment in /venv:
RUN conda-pack -n server -o /tmp/env.tar && \
  mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
  rm /tmp/env.tar

# We put venv in same path it will be in final image, so now fix up paths:
RUN /venv/bin/conda-unpack

# The runtime-stage image; 
# We can use Debian as the base image since the Conda env also includes Python for us.
FROM debian:buster-slim AS runtime

# Copy /venv from the previous stage:
COPY --from=build /venv /venv

# Copy the server code and navigate to it:
# (note: this also copies .env file from the machine it's deployed from)
COPY . /home/server/
WORKDIR /home/server/

EXPOSE 5000

# Allow statements and log messages to immediately appear in the Cloud Run logs
ENV PYTHONUNBUFFERED=True

# When image is run, run the code with the environment activated:
SHELL ["/bin/bash", "-c"]
ENTRYPOINT source /venv/bin/activate && \
  exec uvicorn \
  --host 0.0.0.0 --port 5000 \
  --workers 3 --loop uvloop --lifespan on \
  --limit-max-requests 5000 \
  --timeout-graceful-shutdown 10 \
  main:app

## uvicorn can manage multiple processes via "workers"
## Guideline is number of workers to be (2 * num_cores) + 1
## So in our cloud run "1 vCPU" environment, target workers is 3    (set in Dockerfile where we execute uvicorn)

# max-requests is how many requests before restarting worker (to avoid out-of-memory exceptions from slow leaks)
