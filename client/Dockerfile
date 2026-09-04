ARG APP
FROM node:20-alpine AS builder
WORKDIR /app
COPY packages ./packages
COPY ${APP}/client/package.json ${APP}/client/package-lock.json* ./client/
RUN cd client && npm ci
COPY ${APP}/client ./client
RUN cd client && npm run build

FROM nginx:alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]