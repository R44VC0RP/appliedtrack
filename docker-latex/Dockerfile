FROM ubuntu:22.04

ENV DEBIAN_FRONTEND noninteractive
ENV PATH="/usr/local/texlive/2023/bin/x86_64-linux:${PATH}"

# Install minimal dependencies
RUN apt-get update -q && \
    apt-get install -y -qq --no-install-recommends \
        python3 \
        python3-pip \
        texlive-base \
        texlive-latex-recommended \
        texlive-fonts-recommended \
        && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
COPY app.py .

RUN pip3 install --no-cache-dir -r requirements.txt

# Verify pdftex installation
RUN pdftex --version

EXPOSE 8000

CMD ["python3", "app.py"]