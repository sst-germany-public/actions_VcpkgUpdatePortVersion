const core = require('@actions/core');
const fs = require('fs');

async function updateVersion(filename, version) {
    if (!filename) throw new Error('Filename is required');
    if (!version) throw new Error('Version is required');


    // Datei einlesen
    const raw = fs.readFileSync(filename, 'utf8');

    // In JS-Objekt parsen
    const json = JSON.parse(raw);

    // Version ändern
    json.version = version;

    // Datei zurückschreiben (schön formatiert)
    fs.writeFileSync(filename, JSON.stringify(json, null, 2));

    console.log(`✅ Version auf ${json.version} aktualisiert`);
}

async function run() {
    try {
        // Eingabeparameter auslesen
        const filename = core.getInput('filename');
        const version = core.getInput('version');

        // Log ausgeben			 
        console.log(`Input filename: ${filename}`);
        console.log(`Input version: ${version}`);

        await updateVersion(filename, version);

        // Output setzen
        core.setOutput('success', `true`);
    }
    catch (error) {
        core.setOutput('success', `false`);
        core.setFailed(error.message);
    }
}

run();


