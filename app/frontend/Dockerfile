FROM nginx:alpine

# Create a directory for the environment variables
RUN mkdir -p /usr/share/nginx/html/env

# Copy the HTML file to Nginx's default public directory
COPY index.html /usr/share/nginx/html/

# Copy a custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a script to generate environment variables
RUN echo '#!/bin/sh' > /docker-entrypoint.d/10-env.sh && \
    echo 'echo "window.ENV = { VITE_BACKEND_URL: \"$VITE_BACKEND_URL\" };" > /usr/share/nginx/html/env/config.js' >> /docker-entrypoint.d/10-env.sh && \
    chmod +x /docker-entrypoint.d/10-env.sh

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 