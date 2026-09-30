FROM node:22-bookworm

WORKDIR /app

# Install Python and tools needed by the ML service
RUN apt-get update && \
    apt-get install -y python3 python3-venv python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

# Copy package files first
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Build React/Vite frontend
RUN npm run build

# Render supplies PORT automatically
ENV NODE_ENV=production

EXPOSE 10000

CMD ["npm", "start"]
