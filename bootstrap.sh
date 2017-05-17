#!/bin/bash

# by Simon Kenny
# based on bootstrap.sh at https://github.com/jpmorganchase/quorum-examples (unlicensed)


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
# Ubuntu version
if lsb_release -r | grep -o -i -q "16.04"
then
	echo $GREEN"Ubunutu 16.04 up to date"$RESET
else
	echo $RED"Ubunutu version is not correct, v16.04 is required"
	echo $WHITE"Current version:"$YELLOW
	lsb_release -r
	echo $RESET
	exit
fi

# install build deps
# update apt-get repos
echo $CYAN"Installing dependencies..."$RESET
add-apt-repository ppa:ethereum/ethereum
apt-get update
# optional upgrade
echo $YELLOW"If this is a new Ubuntu installation you might wish to upgrade all possible components."
while true; do
	echo -n $WHITE"Upgrade? (Y/n):"
	read answer
	if [[ -z "$answer" ]]
		then
		echo $RED"Please answer Y or n (case sensitive)"
		echo
	else
		if [[ $answer == "n" ]]
			then
			echo $YELLOW"Not upgrading Ubuntu"$RESET
			break
		fi
		if [[ $answer == "Y" ]]
			then
			echo $CYAN"Upgrading Ubuntu..."$RESET
			apt-get upgrade -y
			break
		fi
		echo $RED"Please answer Y or n (case sensitive)"
		echo
	fi
done
# install dependencies
apt-get install -y build-essential unzip libdb-dev libsodium-dev zlib1g-dev libtinfo-dev solc sysvbanner wrk

# install constellation
echo $CYAN"Installing constellation..."$RESET
wget -q https://github.com/jpmorganchase/constellation/releases/download/v0.0.1-alpha/ubuntu1604.zip
unzip ubuntu1604.zip
cp ubuntu1604/constellation-node /usr/local/bin && chmod 0755 /usr/local/bin/constellation-node
cp ubuntu1604/constellation-enclave-keygen /usr/local/bin && chmod 0755 /usr/local/bin/constellation-enclave-keygen
rm -rf ubuntu1604.zip ubuntu1604

# install golang
echo $CYAN"Installing golang..."$RESET
GOREL=go1.7.3.linux-amd64.tar.gz
wget -q https://storage.googleapis.com/golang/$GOREL
tar xfz $GOREL
mv go /usr/local/go
rm -f $GOREL
PATH=$PATH:/usr/local/go/bin
echo 'PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# make/install quorum
echo $CYAN"Make and install quorum..."$RESET
git clone https://github.com/jpmorganchase/quorum.git
pushd quorum >/dev/null
git checkout tags/v1.1.0
make all
cp build/bin/geth /usr/local/bin
cp build/bin/bootnode /usr/local/bin
popd >/dev/null

# copy examples
#cp -r /vagrant/examples /home/ubuntu/quorum-examples
#chown -R ubuntu:ubuntu /home/ubuntu/quorum /home/ubuntu/quorum-examples

# done!
banner "Quorum"
echo
echo $GREEN"Set up of Quorum complete"