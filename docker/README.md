# Docker configuration for Metal OGM monorepo

# Images:
#   - metal-app: Production runner image
#   - metal-dev: Development builder image (with hot reload)
#   - neo4j: Neo4j database (official image)

# Quick start:
#   docker compose -f docker/docker-compose.yml up -d neo4j
#   docker compose -f docker/docker-compose.yml up --build metal-dev

# Build production image:
#   docker build -f docker/Dockerfile -t metal:latest --target runner .

# Run production:
#   docker run -p 3000:3000 -e NEO4J_URI=bolt://localhost:7687 metal:latest
