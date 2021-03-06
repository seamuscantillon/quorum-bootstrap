#!/bin/bash

# by Simon Kenny
# bootstrap.sh - ties together all scripts to run complete set up of Quorum blockchain


# pre-setup script
# colouring
BOLD="$(tput bold)"
RED="$(tput setaf 1)"
GREEN="$(tput setaf 2)"
YELLOW="$(tput setaf 3)"
BLUE="$(tput setaf 4)"
MAGENTA="$(tput setaf 5)"
CYAN="$(tput setaf 6)"
WHITE="$(tput setaf 7)"
RESET="$(tput sgr0)"

# pre-install checks
# Running as root
if [ "$EUID" -ne 0 ]
	then echo $RED"Please run this script as root"
echo $RESET
	exit
fi

echo $GREEN"bootstrap Quorum blockchain set up"

echo $MAGENTA"Install Quorum..."
./install-quorum.sh
echo $MAGENTA"Prepare tools for node config..."
./prepare-node-gen-tools.sh

