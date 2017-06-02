#!/bin/bash

# by Simon Kenny

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

# install build deps
echo $CYAN"Installing tools..."$RESET
apt-get update
apt-get install -y nodejs-legacy npm
npm install web3
npm install q

echo
echo $GREEN"Preparation done for nodes set up"$RESET
echo $WHITE"Run "$CYAN"node gen-keys-and-config.js"$WHITE" to continue process"$RESET
