# Getlood Authelia - Custom Docker Image
# This Dockerfile extends the official Authelia image with Getlood branding

FROM authelia/authelia:4.38.6

# Metadata
LABEL maintainer="Getlood Team"
LABEL version="1.0.0"
LABEL description="Authelia authentication server with Getlood branding"

# Switch to root to install customizations
USER root

# Create directories for custom assets
RUN mkdir -p /app/public/assets/getlood \
    && mkdir -p /app/themes/getlood \
    && chown -R authelia:authelia /app/public/assets/getlood /app/themes/getlood

# Copy Getlood assets
COPY --chown=authelia:authelia assets/getlood-logo.svg /app/public/assets/getlood/logo.svg
COPY --chown=authelia:authelia assets/getlood-theme.css /app/themes/getlood/theme.css

# Create a custom index.html template (if needed)
# This would replace the default Authelia frontend
# For now, we'll inject CSS via configuration

# Copy custom configuration template
COPY --chown=authelia:authelia docker/config-template.yaml /etc/authelia/configuration.template.yml

# Environment variables for runtime configuration
ENV AUTHELIA_JWT_SECRET_FILE=/run/secrets/jwt_secret \
    AUTHELIA_SESSION_SECRET_FILE=/run/secrets/session_secret \
    AUTHELIA_STORAGE_ENCRYPTION_KEY_FILE=/run/secrets/encryption_key \
    AUTHELIA_IDENTITY_PROVIDERS_OIDC_HMAC_SECRET_FILE=/run/secrets/hmac_secret \
    AUTHELIA_STORAGE_POSTGRES_PASSWORD_FILE=/run/secrets/pg_password \
    GETLOOD_BRANDING=enabled

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:9091/api/health || exit 1

# Switch back to authelia user
USER authelia

# Expose Authelia port
EXPOSE 9091

# Use the default Authelia entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["--config", "/config/configuration.yml"]
