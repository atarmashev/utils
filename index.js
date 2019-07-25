#!/usr/bin/env node

const { generateValidators } = require('./gv/gv');

/**
 * Converts px to vw in all .css, .scss, .sass and .less files.
 */
function convertPXToVW() {
    console.log('Not supported yet.');
}
/**
 * Executes command line interface. Useful when command line args were not set.
 */
function execCommandLineInterface() {
    console.log('Enter what should be done:');
    console.log('\tgv - generate validators for TypeScript interfaces');
    console.log('\tvw - convert PX to VW');
    
    process.openStdin().addListener('data', (value) => {
        const command = value.toString().trim();
    
        if (command === 'gv') {
            generateValidators();
        } else if (command === 'vw') {
            convertPXToVW();
        } else {
            console.log('Unsupported command. Terminating.');
        }
    
        process.exit();
    });
}

const env = process.env;
// searching for required command line parameters
if (env['npm_config_gv']) {
    generateValidators();
} else if (env['npm_config_vw']) {
    convertPXToVW();
} else {
    execCommandLineInterface();
}

