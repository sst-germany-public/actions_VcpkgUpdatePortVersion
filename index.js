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

function runVcpkXAddVersion(vcpkgRegistryPath, portName) {
    if (!vcpkgRegistryPath) throw new Error('vcpkgRegistryPath is required');
    if (!portName) throw new Error('portName is required');

    const cmd = `vcpkg.exe x-add-version ${portName} --overwrite-version`;
    try {
        const output = execSync(cmd, { shell: 'cmd.exe', encoding: 'utf8' });
        console.log(`✅ vcpkg Ausgabe:\n${output}`);
    } catch (error) {
        throw new Error(`Fehler beim Ausführen von vcpkg: ${error.message}`);
    }
}

function run() {
    try {
        const vcpkgRegistryPath = core.getInput('vcpkgRegistryPath');
        const portName = core.getInput('portName');
        const portVersion = core.getInput('portVersion');
        const portGitSHA = core.getInput('portGitSHA');

        console.log(`Input vcpkgRegistryPath: ${vcpkgRegistryPath}`);
        console.log(`Input portName: ${portName}`);
        console.log(`Input portVersion: ${portVersion}`);
        console.log(`Input portGitSHA: ${portGitSHA}`);

        updatePortVcpkgJson(vcpkgRegistryPath, portName, portVersion);
        updatePortfileCMake(vcpkgRegistryPath, portName, portGitSHA);
        runVcpkXAddVersion(vcpkgRegistryPath, portName);

        core.setOutput('success', 'true');
    } catch (error) {
        core.setOutput('success', 'false');
        core.setFailed(error.message);
    }
}

run();
