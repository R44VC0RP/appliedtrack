FROM ubuntu:21.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update -q && \
    apt-get install -y -qq --no-install-recommends \
        ca-certificates \
        curl \
        ghostscript \
        git \
        gnuplot \
        imagemagick \
        make \
        jq \
        qpdf \
        python3 \
        python3-pip \
        python3-pygments \
        wget \
        vim-tiny && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY install-texlive.sh .
COPY texlive.profile .
COPY requirements.txt .
COPY app.py .

RUN chmod +x install-texlive.sh && \
    ./install-texlive.sh && \
    pip3 install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["python3", "app.py"]
