FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive
ENV PATH="/usr/local/texlive/2023/bin/x86_64-linux:${PATH}"

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
        vim-tiny \
        # Add texlive packages
        texlive-full \
        texlive-latex-extra \
        texlive-fonts-recommended && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
COPY app.py .

RUN pip3 install --no-cache-dir -r requirements.txt

# Verify pdflatex installation
RUN pdflatex --version

EXPOSE 8000

CMD ["python3", "app.py"]