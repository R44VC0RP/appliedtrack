# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set working directory in the container
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Make sure the script is executable
RUN chmod +x app.py

# Set Python to run in unbuffered mode
ENV PYTHONUNBUFFERED=1

# Run the application with explicit python path
CMD [ "python", "app.py" ]