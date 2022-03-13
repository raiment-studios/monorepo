# [Choice] Ubuntu version (use hirsuite or bionic on local arm64/Apple Silicon): hirsute, focal, bionic
ARG VARIANT=focal
ARG USERNAME=vscode

FROM mcr.microsoft.com/vscode/devcontainers/base:${VARIANT}

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl wget build-essential \
        tree

RUN echo 'source /workspaces/monorepo/setup.sh' >> /home/vscode/.bashrc 2> /dev/null