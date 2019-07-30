#!/usr/bin/env node

const { generateValidators } = require('./gv/gv');
const { convertPXToVW } = require('./vw/vw');

/**
 * Executes command line interface. Useful when command line args were not set.
 */
function execCommandLineInterface() {
    console.log('Enter what should be done:');
    console.log('\tgv - generate validators for TypeScript interfaces');
    console.log('\tvw - convert PX to VW');

    const socket = process.openStdin();
    
    socket.addListener('data', (value) => {
        socket.removeAllListeners();
        const command = value.toString().trim();
    
        if (command === 'gv') {
            generateValidators();
            process.exit();
        } else if (command === 'vw') {
            convertPXToVW();
        } else {
            console.log('Unsupported command. Terminating.');
            process.exit();
        }
    });
}

const subcommand = process.argv[2];

// searching for required command line parameters
if (subcommand === 'gv') {
    generateValidators();
} else if (subcommand === 'vw') {
    convertPXToVW();
} else {
    execCommandLineInterface();
}

