# [Choice] Ubuntu version (use hirsuite or bionic on local arm64/Apple Silicon): hirsute, focal, bionic
ARG VARIANT=focal
ARG USERNAME=vscode

FROM mcr.microsoft.com/vscode/devcontainers/base:${VARIANT}
ARG NODE_VERSION=16.15.1
ARG GO_VERSION=1.18.3

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl wget build-essential \
    tree \
    gpg gpg-agent git-secret git-lfs

# Install NodeJS
RUN wget "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" && \
    tar xvf "node-v${NODE_VERSION}-linux-x64.tar.xz" && \
    cp -r "node-v${NODE_VERSION}-linux-x64/bin" /usr/ && \
    cp -r "node-v${NODE_VERSION}-linux-x64/include" /usr/ && \
    cp -r "node-v${NODE_VERSION}-linux-x64/lib" /usr/ && \
    cp -r "node-v${NODE_VERSION}-linux-x64/share" /usr/ && \
    rm -rf "node-v${NODE_VERSION}-linux-x64" && \
    rm -f "node-v${NODE_VERSION}-linux-x64.tar.xz"

# Install Go
RUN wget "https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz"  && \
    rm -rf /usr/local/go && tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
ENV PATH $PATH:/usr/local/go/bin


# Run the development environment setup script on every login
RUN echo 'source /workspaces/monorepo/setup.sh' >> /home/vscode/.bashrc 2> /dev/null

USER vscode
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y