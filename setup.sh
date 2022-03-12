#!/usr/bin/env bash


git config pull.rebase false


# Codespaces bash prompt theme
__bash_prompt() {
    local RT_BLUE=$(echo -en '\x1b[38;2;60;130;192m')
    local SCC_GRAY50=$(echo -en '\x1b[38;2;128;128;128m')
    local RT_PURPLE=$(echo -en '\x1b[38;2;98;95;241m')
    local RT_RESET=$(echo -en "\x1b[0m\n")
    

    local userpart='`export XIT=$? \
        && [ ! -z "${GITHUB_USER}" ] && echo -n "\[\033[0;32m\]@${GITHUB_USER} " || echo -n "\[\033[0;32m\]\u " \
        && [ "$XIT" -ne "0" ] && echo -n "\[\033[1;31m\]➜" || echo -n "\[\033[0m\]➜"`'
    local gitbranch='`\
        if [ "$(git config --get codespaces-theme.hide-status 2>/dev/null)" != 1 ]; then \
            export BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null); \
            if [ "${BRANCH}" != "" ]; then \
                echo -n "\[\033[0;36m\](\[\033[1;31m\]${BRANCH}" \
                && if git ls-files --error-unmatch -m --directory --no-empty-directory -o --exclude-standard ":/*" > /dev/null 2>&1; then \
                        echo -n " \[\033[1;33m\]🟡"; \
                else \
                    echo -n " \[\033[1;33m\]"🟢; \
                fi \
                && echo -n "\[\033[0;36m\]) "; \
            fi; \
        fi`'
    local lightblue='\[\033[1;34m\]'
    local removecolor='\[\033[0m\]'
    PS1="${userpart} ${lightblue}\w ${gitbranch}${removecolor}\$ "

    PS1="\n\[${RT_BLUE}\]${userpart} ${gitbranch}\[${RT_RESET}\] \[${SCC_GRAY50}\]\w\[${RT_RESET}\]\n\[${RT_PURPLE}\]$ \[${RT_RESET}\]"
    unset -f __bash_prompt
}
__bash_prompt




alias gs='git status'
alias gcap='git pull && git add . && git commit -m "Update" && git push'