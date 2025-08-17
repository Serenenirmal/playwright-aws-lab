# Use AWS Lambda Node.js 18 base image
FROM public.ecr.aws/lambda/nodejs:18

# Install system dependencies for Playwright
RUN yum update -y && \
    yum install -y \
    wget \
    unzip \
    fontconfig \
    freetype \
    && yum clean all

# Copy package files
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install Node.js dependencies
RUN npm ci --only=production

# Install Playwright and browsers
RUN npx playwright install chromium --with-deps

# Copy application code
COPY scripts/ ${LAMBDA_TASK_ROOT}/scripts/
COPY tests/ ${LAMBDA_TASK_ROOT}/tests/
COPY playwright.config.ts ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "scripts/lambda-handler.handler" ]

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Lambda container healthy')"

# Labels for container metadata
LABEL maintainer="SDET Team"
LABEL version="1.0"
LABEL description="Playwright tests running on AWS Lambda"
