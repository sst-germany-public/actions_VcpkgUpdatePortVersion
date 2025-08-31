const core = require('@actions/core');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
            


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

async function runVcpkgAddVersion() {
    return new Promise((resolve, reject) => {
        // Pfad zu vcpkg.exe unter Windows
        const cmd = '..\\vcpkg\\vcpkg.exe x-add-version meinlib --overwrite-version';

        exec(cmd, { shell: 'cmd.exe' }, (error, stdout, stderr) => {
            if (error) {
                reject(`Fehler beim Ausführen von vcpkg: ${error.message}`);
                return;
            }

            if (stderr) {
                console.warn(`⚠️ vcpkg Fehlerausgabe: ${stderr}`);
            }

            console.log(`✅ vcpkg Ausgabe:\n${stdout}`);
            resolve();
        });
    });
}

async function sss() {
	// (REF\s+)([a-f0-9]{40})(\s+#\s+CI/CD-Replace)
	const portfilePath = 'portfile.cmake'; // Pfad zu Ihrer Datei
	const newSha = '${{ steps.get_sha.outputs.CURRENT_SHA }}';

	let content = fs.readFileSync(portfilePath, 'utf8');
	const regex = /(REF\s+)([a-f0-9]{40})(\s+#\s+CICD\sReplace)/; // Regulärer Ausdruck, der REF gefolgt von einem 40-stelligen SHA findet
	
	if (content.match(regex)) {
	  content = content.replace(regex, 'REF ' + newSha + ' # CICD Replace');
	  fs.writeFileSync(portfilePath, content, 'utf8');
	  console.log('portfile.cmake successfully updated with new SHA:', newSha);
	} else {
	  console.error('REF line not found in portfile.cmake.');
	  process.exit(1);
	}
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
        await runVcpkgAddVersion();

        // Output setzen
        core.setOutput('success', `true`);
    }
    catch (error) {
        core.setOutput('success', `false`);
        core.setFailed(error.message);
    }
}

run();


