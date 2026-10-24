FROM alpine:3.21

ARG PB_VERSION=0.40.6
RUN apk add --no-cache ca-certificates unzip \
    && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -O /tmp/pocketbase.zip \
    && unzip /tmp/pocketbase.zip pocketbase -d /pb \
    && rm /tmp/pocketbase.zip

WORKDIR /pb
COPY pb_schema.json ./pb_schema.json
COPY pb_migrations ./pb_migrations
COPY pb_hooks ./pb_hooks

EXPOSE 8090
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
