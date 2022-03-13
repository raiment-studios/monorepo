#!/usr/bin/env bash

# -----------------------------------------------------------------------------
# Environment variables
# -----------------------------------------------------------------------------

# Store the root of the repository as a well-known, "stable" reference environment
# variables which scripts can access other assets in the repo.
#
# https://stackoverflow.com/questions/59895/how-can-i-get-the-source-directory-of-a-bash-script-from-within-the-script-itsel
#
export MONOREPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# -----------------------------------------------------------------------------
# Environment configuration
# -----------------------------------------------------------------------------

# Set this both for consistency and to avoid warnings
git config pull.rebase false

# Get rid of unreadable green background from ls
# https://stackoverflow.com/questions/40574819/how-to-remove-dir-background-in-ls-color-output
dircolors -p | sed 's/;42/;01/' > ~/.dircolors

# Ensure rust is set up
source $HOME/.cargo/env

# -----------------------------------------------------------------------------
# Bash prompt
# -----------------------------------------------------------------------------

# Bash prompt customized from Codespaces default
__bash_prompt() {
    local RT_BLUE=$(echo -en '\x1b[38;2;60;130;192m')
    local RT_GRAY50=$(echo -en '\x1b[38;2;128;128;128m')
    local RT_PURPLE=$(echo -en '\x1b[38;2;98;95;241m')
    local RT_RESET=$(echo -en "\x1b[0m\n")
    
    local userpart='`export XIT=$? \
        && [ ! -z "${GITHUB_USER}" ] && echo -n "\[\033[0;32m\]@${GITHUB_USER}" || echo -n "\[\033[0;32m\]\u"`'
    local gitbranch='`\
        if [ "$(git config --get codespaces-theme.hide-status 2>/dev/null)" != 1 ]; then \
            export BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null); \
            if [ "${BRANCH}" != "" ]; then \
                echo -n "\[\033[0;36m\](\[\033[1;31m\]${BRANCH}" \
                && if git ls-files --error-unmatch -m --directory --no-empty-directory -o --exclude-standard ":/*" > /dev/null 2>&1; then \
                        echo -n " \[\033[1;33m\]🔶"; \
                else \
                    echo -n " \[\033[1;33m\]"🟢; \
                fi \
                && echo -n "\[\033[0;36m\]) "; \
            fi; \
        fi`'
    local lightblue='\[\033[1;34m\]'
    local removecolor='\[\033[0m\]'
    PS1="${userpart} ${lightblue}\w ${gitbranch}${removecolor}\$ "

    PS1="\n\[${RT_BLUE}\]${userpart} ${gitbranch}\[${RT_RESET}\] \[${RT_GRAY50}\]\w\[${RT_RESET}\]\n\[${RT_PURPLE}\]$ \[${RT_RESET}\]"
    unset -f __bash_prompt
}
__bash_prompt

# -----------------------------------------------------------------------------
# Aliases and short-cuts
# -----------------------------------------------------------------------------


function __shortcut_cmd {
    case "$2" in
    "")       $1 $MONOREPO_ROOT ;;
    /)        $1 $MONOREPO_ROOT ;;
    st*)      $1 $MONOREPO_ROOT/source/projects/storytelling ;;
    *)        $1 $MONOREPO_ROOT ;;
    esac
}

function rcd {
    __shortcut_cmd "cd" $1 
}

#  Convenience aliases
alias gs='git status'


# gcap = git commit and pull from the root of the repo
#
# This is a convenience for early, solo development (where reviews are not
# yet taking place).
#
function gcap {
    local arg=$*
    local message="${arg:='update'}"
    pushd $MONOREPO_ROOT > /dev/null
    git pull 
    git add .
    git commit -m \""${message}"\"
    git push
    popd > /dev/null
}

# -----------------------------------------------------------------------------
# Greeting with basic info
# -----------------------------------------------------------------------------

__intro() {

    local RT_BLUE=$(echo -en '\x1b[38;2;60;130;192m')
    local RT_GRAY50=$(echo -en '\x1b[38;2;128;128;128m')
    local RT_PURPLE=$(echo -en '\x1b[38;2;98;95;241m')
    local RT_RESET=$(echo -en "\x1b[0m\n")

    echo
    echo
    echo
    printf "${RT_BLUE}Raiment development environment${RT_RESET}\n"
    printf "${RT_BLUE}-------------------------------${RT_RESET}\n"
    echo
    printf "${RT_PURPLE}Project structure${RT_RESET}\n"
    tree -d -L 2 -n $(ls -d */)
    unset -f __intro
}
__intro