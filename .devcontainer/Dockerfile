# [Choice] Ubuntu version (use hirsuite or bionic on local arm64/Apple Silicon): hirsute, focal, bionic
ARG VARIANT=focal
FROM mcr.microsoft.com/vscode/devcontainers/base:${VARIANT}

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl wget build-essential

RUN echo 'source /workspaces/monorepo/setup.sh' >> /home/$USERNAME/.bashrc 2> /dev/null