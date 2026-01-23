const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const RELEASE_NOTES_PATH = path.join(PROJECT_ROOT, 'RELEASE_NOTES.md');

// Helper to run commands
const runCommand = (command) => {
    console.log(`\n> ${command}`);
    try {
        execSync(command, { stdio: 'inherit', cwd: PROJECT_ROOT });
    } catch (error) {
        console.error(`Command failed: ${command}`);
        process.exit(1);
    }
};

// Main function
const main = () => {
    // 1. Get Release Summary from arguments
    const summary = process.argv[2];
    if (!summary) {
        console.error('Error: Please provide a release summary.');
        console.error('Usage: node scripts/deploy.js "Release summary here"');
        process.exit(1);
    }

    // 2. Read and Bump Version
    console.log('Bumping version...');
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const versionParts = packageJson.version.split('.').map(Number);
    versionParts[2] += 1; // Increment patch version
    const newVersion = versionParts.join('.');
    packageJson.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Version bumped to ${newVersion}`);

    // 3. Update Release Notes
    console.log('Updating release notes...');
    const date = new Date().toISOString().split('T')[0];
    const noteEntry = `\n## [${newVersion}] - ${date}\n- ${summary}\n`;

    let currentNotes = '';
    if (fs.existsSync(RELEASE_NOTES_PATH)) {
        currentNotes = fs.readFileSync(RELEASE_NOTES_PATH, 'utf8');
    } else {
        currentNotes = '# Release Notes\n';
    }

    // Insert new note after header (assuming header is first line)
    // Or just append if simple. Let's prepend to keep newest on top, after title.
    const noteLines = currentNotes.split('\n');
    let titleIndex = 0;
    if (noteLines.length > 0 && noteLines[0].startsWith('# ')) {
        titleIndex = 1;
    }

    noteLines.splice(titleIndex, 0, noteEntry);
    fs.writeFileSync(RELEASE_NOTES_PATH, noteLines.join('\n'));

    // 4. Build
    console.log('Building project...');
    runCommand('npm run build');

    // 5. Deploy
    console.log('Deploying to Firebase...');
    runCommand('npx firebase deploy --only hosting');

    console.log(`\nSuccessfully deployed version ${newVersion}!`);
};

main();
