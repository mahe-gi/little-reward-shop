# Use the official PostgreSQL Alpine image (lightweight)
FROM postgres:16-alpine

# Environment variables for the local development database
ENV POSTGRES_USER=rewardshop
ENV POSTGRES_PASSWORD=rewardshop
ENV POSTGRES_DB=rewardshop

# Expose default PostgreSQL port
EXPOSE 5432
