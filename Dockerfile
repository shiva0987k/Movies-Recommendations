FROM node:22-bookworm

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ------------------------------------------------------------
# Node dependencies
# ------------------------------------------------------------

COPY package*.json ./

RUN npm install

# ------------------------------------------------------------
# Python dependencies
# ------------------------------------------------------------

COPY requirements.txt ./

RUN pip3 install \
    --break-system-packages \
    --no-cache-dir \
    -r requirements.txt

# ------------------------------------------------------------
# Application source
# ------------------------------------------------------------

COPY . .

# ------------------------------------------------------------
# Build React application
# ------------------------------------------------------------

RUN npm run build

# ------------------------------------------------------------
# Environment
# ------------------------------------------------------------

ENV NODE_ENV=production

ENV PORT=8080

ENV FLASK_PORT=5000

ENV PYTHON_COMMAND=python3

# ------------------------------------------------------------
# Cloud/container port
# ------------------------------------------------------------

EXPOSE 8080

# ------------------------------------------------------------
# Start Node server
# Node server starts Flask automatically
# ------------------------------------------------------------

CMD ["npm", "start"]
