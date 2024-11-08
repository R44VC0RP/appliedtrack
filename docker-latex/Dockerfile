FROM ubuntu:22.04

RUN apt-get update -q && \
    apt-get install -y -qq --no-install-recommends \
        ca-certificates  \
        curl \
        ghostscript \
        git \
        gnuplot \
        imagemagick \
        make \
        jq \
        qpdf \
        python3-pygments \
        python3-pip \
        wget \
        vim-tiny && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /texlive

COPY install-texlive.sh .
COPY texlive.profile .

RUN chmod +x install-texlive.sh && \
    ./install-texlive.sh

WORKDIR /data

COPY main.py .

COPY test.tex .

COPY requirements.txt .

RUN python3 -m pip install --no-cache-dir -r requirements.txt

CMD ["python3", "main.py"]

# VOLUME ["/data"]
