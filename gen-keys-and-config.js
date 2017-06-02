// RUN THIS WITH NODE.JS

// Generate keys and genesis block JSON for Quorum N nodes system

// Ethereum JavaScript lib - web3
const Web3 = require('web3');
const web3 = new Web3();
// Generals libs
const path = require('path');
const fs = require('fs');
const Q = require('q');
const exec = require('child_process').exec;

// consts
const usage = "\nUsage: node gen-keys-and-config.js [num-nodes] [passwords] [voting-nodes-idx] [making-nodes-idx] [min-votes]\n"
	+ "\n\tnum-nodes\t\t(e.g. 3) Set number of nodes to generate"
	+ "\n\tpasswords\t\t(pass1,pass2,pass3) Passwords for new accounts, comma separated"
	+ "\n\tvoting-nodes-idx\t(e.g. 1,2) Indexes of nodes which can vote, comma separated, zero indexed"
	+ "\n\tmaking-nodes-idx\t(e.g. 0,1) Indexes of nodes which can make blocks, comma separated, zero indexed"
	+ "\n\tmin-votes\t\t(e.g. 1) Set minimum number of votes to cast before maker can make block"
	+ "\n";
const MAX_NODES = 100;

const INIT_CONTRACT_ADDR_KEY = "0x0000000000000000000000000000000000000020";
const MIN_VOTES_KEY = "0x0000000000000000000000000000000000000000000000000000000000000001";
const NUM_VOTERS_KEY = "0x0000000000000000000000000000000000000000000000000000000000000002";
const VOTERS_MAP_KEY = "0x0000000000000000000000000000000000000000000000000000000000000003";
const NUM_MAKERS_KEY = "0x0000000000000000000000000000000000000000000000000000000000000004";
const MAKERS_MAP_KEY = "0x0000000000000000000000000000000000000000000000000000000000000005";
const VALUE_PREFIX =  "0x";
const VALUE_TRUE =  "0x01";
const BALANCE_KEY = "balance";
const BALANCE_VALUE = "1000000000000000000000000000";

var numNodes, passwords, votingNodesIdxs, makingNodesIdxs, minVotes;
var accounts = [];

function init(callback) {
	// check there are enough arguments
	if (process.argv.length != 7) {
		console.log(usage);
		process.exit(1);
	}

	// parse args
	numNodes = parseInt(process.argv[2], 10);
	votingNodesIdxs = [];
	passwords = process.argv[3].split(",");
	process.argv[4].split(",").forEach(function (val, index, array) {
		votingNodesIdxs.push(parseInt(val, 10));
	});
	makingNodesIdxs = [];
	process.argv[5].split(",").forEach(function (val, index, array) {
		makingNodesIdxs.push(parseInt(val, 10));
	});
	minVotes = parseInt(process.argv[6], 10);

	// test
	console.log("num nodes: "+numNodes);
	console.log("num passwords: "+passwords.length);
	console.log("voting nodes idx: "+JSON.stringify(votingNodesIdxs));
	console.log("making nodes idx: "+JSON.stringify(makingNodesIdxs));
	console.log("min votes: "+minVotes);	
	console.log("");

	// SANITY CHECK INPUTS
	// sort arrays, allows to check for duplicates
	votingNodesIdxs.sort();
	makingNodesIdxs.sort();

	// check
	if (numNodes === undefined || numNodes === null || isNaN(numNodes) || numNodes < 1 || numNodes > MAX_NODES) {
		console.log("error, num nodes value out of bounds");
		process.exit(1);
	}
	if (passwords.length !== numNodes) {
		console.log("error, number of passwords does not match num nodes");
		process.exit(1);
	}
	passwords.forEach(function (val, index, array) {
		if (val === undefined || val === null) {
			console.log("error, password number "+(index+1)+" is invalid");
			process.exit(1);
		}
	});
	var tmp;
	votingNodesIdxs.forEach(function (val, index, array) {
		if (val === undefined || val === null || isNaN(val) || val < 0 || val > (numNodes - 1)) {
			console.log("error, voting-nodes-idx part "+(index+1)+" \""+val+"\" is out of bounds");
			process.exit(1);
		}
		if (tmp !== undefined && tmp !== null && val === tmp) {
			console.log("error, voting-nodes-idx part "+(index+1)+" contains duplicate value \""+val+"\"");
			process.exit(1);
		}
		tmp = val;
	});
	makingNodesIdxs.forEach(function (val, index, array) {
		if (val === undefined || val === null || isNaN(val) || val < 0 || val > (numNodes - 1)) {
			console.log("error, making-nodes-idx part "+(index+1)+" \""+val+"\" is out of bounds");
			process.exit(1);
		}
		if (tmp !== undefined && tmp !== null && val === tmp) {
			console.log("error, making-nodes-idx part "+(index+1)+" contains duplicate value \""+val+"\"");
			process.exit(1);
		}
		tmp = val;
	});
	callback();
}

// CREATE KEYS
function createKeys(callback) {
	console.log("creating keys...");
	createKeys_recursive(0, numNodes, function() {
		fs.unlink(path.join(__dirname, "tmppw"), function(err) {
			// don't care if there was an error here
			fs.readdir(process.env.HOME+"/.ethereum/keystore/", function(err, files) {
				if (err) {
					console.log("error gettings keys from Ethereum hidden local keystore");
					console.log(err);
					process.exit(1);
				}
				files.forEach(file => {
					console.log("key file: "+file);
				});
				makeKeyDir(function() {
					copyKeys_recursive(0, numNodes, files, function() {
						console.log("Finished copying keys");
						removeKeysFromEthKeystore(function() {
							getAccounts_recursive(0, numNodes, function() {
								console.log("Got account addresses: "+JSON.stringify(accounts));
								callback();
							});
						});
					});
				});
			});
		});
	});
}

function createKeys_recursive(idx, max, callback) {
	console.log(" - creating key "+(idx+1)+"...");
	saveStringToFile("tmppw", passwords[idx], function(err) {
		if (err) {
			console.log("error, saving pw to temp file");
			process.exit(1);
		}
		exec("geth --password tmppw account new", function(err, stdout, stderr) {
			if (err) {
				console.log("error creating account key "+(idx+1)+": "+err.message);
				process.exit(1);
			}
			process.stdout.write(stdout);
			process.stderr.write(stderr);
			if ((idx + 1) >= max) {
				callback();
			} else {
				createKeys_recursive(idx+1, max, callback);
			}
		});
	});
}

function saveStringToFile(filename, str, callback) {
	fs.writeFile(path.join(__dirname, filename), str, function(err) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
			callback();
		}
	});
}

function makeKeyDir(callback) {
	exec("mkdir "+path.join(__dirname, "keys"), function(err, stdout, stderr) {
		process.stdout.write(stdout);
		process.stderr.write(stderr);
		callback();
	});
}

function copyKeys_recursive(idx, max, filenames, callback) {
	exec("cp "+process.env.HOME+"/.ethereum/keystore/"+filenames[idx]+" "+path.join(__dirname, "keys/key"+(idx+1)), function(err, stdout, stderr) {
		if (err) {
			console.log("error creating account key "+(idx+1)+": "+err.message);
			process.exit(1);
		}
		process.stdout.write(stdout);
		process.stderr.write(stderr);
		if ((idx + 1) >= max) {
			callback();
		} else {
			copyKeys_recursive(idx+1, max, filenames, callback);
		}
	});
}

function removeKeysFromEthKeystore(callback) {
	exec("rm "+process.env.HOME+"/.ethereum/keystore/* -R -f", function(err, stdout, stderr) {
		process.stdout.write(stdout);
		process.stderr.write(stderr);
		callback();
	});
}


function getAccounts_recursive(idx, max, callback) {
	fs.readFile(path.join(__dirname, "keys/key"+(idx+1)), function(err, data) {
		if (err) {
			console.log("error, could not read key file "+(idx+1));
			console.log(err);
			process.exit(1);
		}
		var accountInfo = JSON.parse(data);
		accounts.push(accountInfo.address);
		if ((idx + 1) >= max) {
			callback();
		} else {
			getAccounts_recursive(idx+1, max, callback);
		}
	});
}


// CONFIGURE GENESIS.JSON
function configureGenesis(callback) {
	getGenesisTemplate(function(err, genesisConfig) {
		// storage variables
		var storage = genesisConfig.alloc[INIT_CONTRACT_ADDR_KEY].storage;
		var str = minVotes.toString(16); 
		storage[MIN_VOTES_KEY] = VALUE_PREFIX + String("00" + minVotes.toString(16)).slice(-2);
		storage[NUM_VOTERS_KEY] = VALUE_PREFIX + String("00" + votingNodesIdxs.length.toString(16)).slice(-2);
		for (var i = 0 ; i < votingNodesIdxs.length ; i++) {
			storage[web3.sha3(accounts[parseInt(votingNodesIdxs[i], 10)]+VOTERS_MAP_KEY)] = VALUE_TRUE;
		}
		storage[NUM_MAKERS_KEY] = VALUE_PREFIX + String("00" + makingNodesIdxs.length.toString(16)).slice(-2);
		for (var i = 0 ; i < makingNodesIdxs.length ; i++) {
			storage[web3.sha3(accounts[parseInt(makingNodesIdxs[i], 10)]+MAKERS_MAP_KEY)] = VALUE_TRUE;
		}
		// account registration
		for (var i = 0 ; i < accounts.length ; i++) {
			genesisConfig.alloc[VALUE_PREFIX+accounts[i]] = {
				"balance": BALANCE_VALUE
			};
		}
		saveStringToFile("genesis.json", JSON.stringify(genesisConfig), function() {
			callback();
		});
	});
}

function getGenesisTemplate(callback) {
	fs.readFile(path.join(__dirname, "genesis-template.json"), function(err, data) {
		if (err) {
			console.log("error, could not genesis-template.json file");
			console.log(err);
			process.exit(1);
		}
		var obj = JSON.parse(data);
		callback(err, obj);
	});
}


// EXECUTE
init(function() {
	createKeys(function() {
		configureGenesis(function() {
			console.log("Finished");
			process.exit(0);
		});
	});
});
