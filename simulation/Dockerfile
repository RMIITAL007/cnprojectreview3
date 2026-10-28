# Reproducible Dockerfile for NS-2.35 and Python verification suite
# Target: Ubuntu 20.04 Focal Fossa
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && add-apt-repository universe \
    && apt-get update && apt-get install -y --no-install-recommends \
    ns2 \
    nam \
    python3 \
    python3-pip \
    python3-pandas \
    python3-matplotlib \
    bash \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/simulation

# Copy simulation scripts into the container image
COPY . /workspace/simulation/

RUN chmod +x run_all.sh verify_traces.py plot.py plot_arp.py plot_topology.py

CMD ["/bin/bash", "./run_all.sh"]
