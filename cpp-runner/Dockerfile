FROM gcc:12

RUN apt-get update && apt-get install -y coreutils \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /sandbox

COPY entry.sh /entry.sh
RUN chmod +x /entry.sh

WORKDIR /sandbox

ENTRYPOINT ["/entry.sh"]
