# 1. Use a lightweight, fast version of Node.js 20 (matches your local version)
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the package files first (The * prevents crashing if no package.json exists)
COPY package*.json ./

# 4. Install dependencies SAFELY. 
# --ignore-scripts stops malicious code in third-party packages from running during install
# || true ensures the build doesn't fail if there are no dependencies
RUN npm install --ignore-scripts --no-audit --no-fund || true

# 5. Copy the rest of the workspace files into the container
COPY . .

# 6. Default command (Your validator.js overrides this when it runs `node -c`)
CMD ["node", "-v"]