# [Choice] Ubuntu version (use hirsuite or bionic on local arm64/Apple Silicon): hirsute, focal, bionic
ARG VARIANT=focal
ARG USERNAME=vscode

FROM mcr.microsoft.com/vscode/devcontainers/base:${VARIANT}

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl wget build-essential \
        tree

# Install NodeJS
RUN wget https://nodejs.org/dist/v16.14.0/node-v16.14.0-linux-x64.tar.xz && \
    tar xvf node-v16.14.0-linux-x64.tar.xz && \
    cp -r node-v16.14.0-linux-x64/bin /usr/ && \
    cp -r node-v16.14.0-linux-x64/include /usr/ && \
    cp -r node-v16.14.0-linux-x64/lib /usr/ && \
    cp -r node-v16.14.0-linux-x64/share /usr/

# Run the development environment setup script on every login
RUN echo 'source /workspaces/monorepo/setup.sh' >> /home/vscode/.bashrc 2> /dev/null