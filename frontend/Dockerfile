# Use a node base image for the build stage
FROM --platform=linux/amd64 node:18.12 as build-stage

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY ./ .

# Set the yarn version and install dependencies
RUN yarn set version 3.5.0 && \
    yarn install --silent

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Build the application
RUN yarn build --verbose

# Use the latest nginx image for the production stage
FROM --platform=linux/amd64 nginx:latest as production-stage

# Create a directory for the application in the nginx container
RUN mkdir /app

# Copy the build files from the build stage to the nginx container
COPY --from=build-stage /app/build /app

# Copy the NGINX configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Build metadata — injected by 02-build.sh, accessible via /debug/info
# Stored in /usr/local/ to avoid being shadowed by the /app volume mount.
ARG BUILD_DATE=unknown
ARG BUILD_VERSION=unknown
ARG REACT_APP_BASE_URL_API=
LABEL org.movetodata.buildDate="${BUILD_DATE}" \
      org.movetodata.version="${BUILD_VERSION}" \
      org.movetodata.reactAppBaseUrlApi="${REACT_APP_BASE_URL_API}"
RUN printf '{"version":"%s","buildDate":"%s","reactAppBaseUrlApi":"%s"}\n' \
      "${BUILD_VERSION}" "${BUILD_DATE}" "${REACT_APP_BASE_URL_API}" \
    > /usr/local/build-info.json
