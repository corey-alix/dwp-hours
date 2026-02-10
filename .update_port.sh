#!/bin/bash

__update_port_for_workspace() {
    if [ "$PWD" = "$__LAST_PORT_PWD" ]; then
        return
    fi

    __LAST_PORT_PWD="$PWD"

    local root
    local script_path
    local new_port

    root=$(git rev-parse --show-toplevel 2>/dev/null)

    if [ -n "$root" ] && [ -f "$root/scripts/set-port.sh" ]; then
        script_path="$root/scripts/set-port.sh"
    elif [ -f "$PWD/scripts/set-port.sh" ]; then
        script_path="$PWD/scripts/set-port.sh"
    elif [ -f "$PWD/set-port.sh" ]; then
        script_path="$PWD/set-port.sh"
    fi

    if [ -n "$script_path" ]; then
        new_port="$(bash "$script_path")"
        if [ -n "$new_port" ]; then
            PORT="$new_port"
            export PORT
        fi
    fi
}
