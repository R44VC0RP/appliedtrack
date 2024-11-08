FROM mingc/latex:latest

# Install Python and pip
RUN apt-get update -q && \
    apt-get install -y -qq --no-install-recommends \
        python3 \
        python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /data

COPY main.py .
COPY test.tex .
COPY requirements.txt .

RUN python3 -m pip install --no-cache-dir -r requirements.txt

CMD ["python3", "main.py"]
