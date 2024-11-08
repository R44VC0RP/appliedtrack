FROM mingc/latex:latest

# Update sources.list to use a supported Ubuntu version (jammy - 22.04 LTS)
RUN sed -i -e 's/hirsute/jammy/g' /etc/apt/sources.list

# Install Python and pip
RUN apt-get update && \
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
