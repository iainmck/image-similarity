#!/bin/sh

# CALL THIS FILE FROM /server root

VERSION=1.00

docker build --platform linux/amd64 -f ./deployment/Dockerfile -t us-central1-docker.pkg.dev/alma-454302/servers/image-similarity:v${VERSION} .
docker push us-central1-docker.pkg.dev/alma-454302/servers/image-similarity:v${VERSION}

## Tweak CPU & memory through looking at actual usage in GCP dashboard

gcloud run deploy image-similarity \
--image=us-central1-docker.pkg.dev/alma-454302/servers/image-similarity:v${VERSION} \
--port=5000 \
--allow-unauthenticated \
--concurrency=50 \
--min-instances=1 \
--max-instances=2 \
--cpu=1 \
--memory=1Gi \
--region=us-central1 \
--project=alma-454302
#--no-cpu-throttling
