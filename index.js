// Inputs:
// - vcpkgRegistryPath: Path to the vcpkg registry.
// - portName: The port name to update.
// - portVersion: The new version number of the port.
// - portGitSHA: The Git-Commit-SHA of the port version, that is used for the update.

const core = require('@actions/core');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function updatePortVcpkgJson(vcpkgRegistryPath, portName, portVersion) {
    if (!vcpkgRegistryPath) throw new Error('vcpkgRegistryPath is required');
    if (!portName) throw new Error('portName is required');
    if (!portVersion) throw new Error('portVersion is required');

    const portfilePath = path.join(vcpkgRegistryPath, 'ports', portName, 'vcpkg.json');

    const raw = fs.readFileSync(portfilePath, 'utf8');
    const json = JSON.parse(raw);

    json.version = portVersion;

    fs.writeFileSync(portfilePath, JSON.stringify(json, null, 2));

    console.log(`✅ ${portfilePath}: Version auf ${json.version} aktualisiert`);
}

function updatePortfileCMake(vcpkgRegistryPath, portName, portGitSHA) {
    if (!vcpkgRegistryPath) throw new Error('vcpkgRegistryPath is required');
    if (!portName) throw new Error('portName is required');
    if (!portGitSHA) throw new Error('portGitSHA is required');

    const portfilePath = path.join(vcpkgRegistryPath, 'ports', portName, 'portfile.cmake');

    let content = fs.readFileSync(portfilePath, 'utf8');
    const regex = /(REF\s+)([a-f0-9]{40})(\s+#\s+CICD\sReplace)/;

    if (content.match(regex)) {
        content = content.replace(regex, 'REF ' + portGitSHA + ' # CICD Replace');
        fs.writeFileSync(portfilePath, content, 'utf8');
        console.log(`✅ ${portfilePath}: successfully updated with new SHA: ${portGitSHA}`);
    } else {
        throw new Error(`${portfilePath}: 'REF line not found in portfile.cmake.`);
    }
}

function runVcpkFormatManifest(vcpkgRegistryPath, portName) {
    if (!vcpkgRegistryPath) throw new Error('vcpkgRegistryPath is required');
    if (!portName) throw new Error('portName is required');

    const cmd = `vcpkg format-manifest ./ports/${portName}/vcpkg.json`;

    try {
        const output = execSync(cmd, {
            cwd: vcpkgRegistryPath, // Arbeitsverzeichnis = Registry
            shell: 'cmd.exe',
            encoding: 'utf8'
        });

        console.log(`✅ vcpkg format-manifest Ausgabe:\n${output}`);
    } catch (error) {
        throw new Error(`Fehler beim Ausführen von vcpkg format-manifest: ${error.message}`);
    }
}

function runVcpkXAddVersion(vcpkgRegistryPath, portName) {
    if (!vcpkgRegistryPath) throw new Error('vcpkgRegistryPath is required');
    if (!portName) throw new Error('portName is required');

    //const cmd = `vcpkg --x-builtin-ports-root=./ports --x-builtin-registry-versions-dir=./versions x-add-version --all --verbose`;
    const cmd = `vcpkg --x-builtin-ports-root=./ports --x-builtin-registry-versions-dir=./versions x-add-version ${portName} --overwrite-version`;

    try {
        const output = execSync(cmd, {
            cwd: vcpkgRegistryPath, // Arbeitsverzeichnis = Registry
            shell: 'cmd.exe',
            encoding: 'utf8'
        });

        console.log(`✅ vcpkg x-add-version Ausgabe:\n${output}`);
    } catch (error) {
        throw new Error(`Fehler beim Ausführen von vcpkg x-add-version: ${error.message}`);
    }
}

function run() {
    try {
        const vcpkgRegistryPath = core.getInput('vcpkgRegistryPath');
        const portName = core.getInput('portName');
        const str_updateVersionsDatabase = core.getInput('updateVersionsDatabase');
        const str_updatePortNameDatabase = core.getInput('updatePortNameDatabase');
        const portVersion = core.getInput('portVersion');
        const portGitSHA = core.getInput('portGitSHA');

        console.log(`Input vcpkgRegistryPath: ${vcpkgRegistryPath}`);
        console.log(`Input portName: ${portName}`);
        console.log(`Input updateVersionsDatabase: ${str_updateVersionsDatabase}`);
        console.log(`Input updatePortNameDatabase: ${str_updatePortNameDatabase}`);
        console.log(`Input portVersion: ${portVersion}`);
        console.log(`Input portGitSHA: ${portGitSHA}`);

		// Konvert string to bool
		const updateVersionsDatabase = str_updateVersionsDatabase.toLowerCase() === 'true';
		const updatePortNameDatabase = str_updatePortNameDatabase.toLowerCase() === 'true';
		
		// Make sure Input is valid.
		if (!updateVersionsDatabase && !updatePortNameDatabase) throw new Error('input.updateVersionsDatabase and input.updatePortNameDatabase must not both be "false".');
		if (updateVersionsDatabase && updatePortNameDatabase) throw new Error('input.updateVersionsDatabase and input.updatePortNameDatabase must not both be "true".');

		// Call methods depending on variables
		if (updatePortNameDatabase) {			
			if (!vcpkgRegistryPath) throw new Error('vcpkgRegistryPath is required');
			if (!portName) throw new Error('portName is required');
			if (!portGitSHA) throw new Error('portGitSHA is required');
			if (!portVersion) throw new Error('portVersion is required');
			
			updatePortVcpkgJson(vcpkgRegistryPath, portName, portVersion);
			updatePortfileCMake(vcpkgRegistryPath, portName, portGitSHA);
		} else if (updateVersionsDatabase) {			
			if (!vcpkgRegistryPath) throw new Error('vcpkgRegistryPath is required');
			if (!portName) throw new Error('portName is required');
			
			runVcpkFormatManifest(vcpkgRegistryPath, portName);
			runVcpkXAddVersion(vcpkgRegistryPath, portName);
		} else {
			throw new Error('Ha! Nicht nachgedacht. Check mal dein Skript du Dumpfnase...');
		}

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
