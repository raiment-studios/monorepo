#!/usr/bin/env bash


git config pull.rebase false

alias gs='git status'
alias gcap='git pull && git add . && git commit -m "Update" && git push'