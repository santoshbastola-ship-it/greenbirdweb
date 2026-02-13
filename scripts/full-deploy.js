const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const RELEASE_NOTES_PATH = path.join(PROJECT_ROOT, 'RELEASE_NOTES.md');

// Helper to run commands
const runCommand = (command, description) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ${description}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`> ${command}\n`);
    try {
        execSync(command, { stdio: 'inherit', cwd: PROJECT_ROOT });
        console.log(`✅ ${description} - SUCCESS`);
    } catch (error) {
        console.error(`❌ ${description} - FAILED`);
        console.error(`Command failed: ${command}`);
        process.exit(1);
    }
};

// Main function
const main = () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           🚀 FULL PRODUCTION DEPLOYMENT                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 1. Get Release Summary from arguments
    const summary = process.argv[2];
    if (!summary) {
        console.error('❌ Error: Please provide a release summary.');
        console.error('Usage: npm run deploy:full "Release summary here"');
        process.exit(1);
    }

    // 2. Clean up test data
    console.log('🧹 Step 1: Cleaning up test data...');
    runCommand('npm run cleanup:test-data', 'Test Data Cleanup');

    // 3. Read and Bump Version
    console.log('\n📦 Step 2: Bumping version...');
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const versionParts = packageJson.version.split('.').map(Number);
    versionParts[2] += 1; // Increment patch version
    const newVersion = versionParts.join('.');
    packageJson.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Version bumped to ${newVersion}`);

    // 4. Update Release Notes
    console.log('\n📝 Step 3: Updating release notes...');
    const date = new Date().toISOString().split('T')[0];
    const noteEntry = `\n## [${newVersion}] - ${date}\n- ${summary}\n`;

    let currentNotes = '';
    if (fs.existsSync(RELEASE_NOTES_PATH)) {
        currentNotes = fs.readFileSync(RELEASE_NOTES_PATH, 'utf8');
    } else {
        currentNotes = '# Release Notes\n';
    }

    const noteLines = currentNotes.split('\n');
    let titleIndex = 0;
    if (noteLines.length > 0 && noteLines[0].startsWith('# ')) {
        titleIndex = 1;
    }

    noteLines.splice(titleIndex, 0, noteEntry);
    fs.writeFileSync(RELEASE_NOTES_PATH, noteLines.join('\n'));
    console.log(`✅ Release notes updated`);

    // 5. Git: Add, Commit, and Push
    console.log('\n📤 Step 4: Pushing to Git...');
    runCommand('git add .', 'Git Add');
    runCommand(`git commit -m "Release v${newVersion}: ${summary}"`, 'Git Commit');
    runCommand('git push', 'Git Push');

    // 6. Run Tests
    console.log('\n🧪 Step 5: Running tests...');
    runCommand('npm run test', 'Run Tests');

    // 7. Build
    console.log('\n🔨 Step 6: Building project...');
    runCommand('npm run build', 'Build Project');

    // 7.1 Verify PWA assets
    const pwaAssets = [
        path.join(PROJECT_ROOT, 'out', 'sw.js'),
        path.join(PROJECT_ROOT, 'out', 'manifest.json')
    ];

    let pwaValid = true;
    pwaAssets.forEach(asset => {
        if (fs.existsSync(asset)) {
            console.log(`  ✅ Found: ${path.basename(asset)}`);
        } else {
            console.error(`  ❌ Missing: ${path.basename(asset)}`);
            pwaValid = false;
        }
    });

    if (!pwaValid) {
        console.error('\n❌ PWA assets not generated properly!');
        console.error('   The build may not function as a PWA.');
        console.error('   Check next.config.ts and next-pwa configuration.');
        process.exit(1);
    }
    console.log('  ✅ PWA assets verified successfully');

    // 8. Build Functions
    console.log('\n⚙️  Step 7: Building functions...');
    runCommand('cd functions && npm install && npm run build', 'Build Functions');

    // 9. Deploy
    console.log('\n🚀 Step 8: Deploying to Firebase...');
    runCommand('npx firebase deploy', 'Firebase Deploy');

    // Success
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ DEPLOYMENT SUCCESSFUL                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`📦 Version: ${newVersion}`);
    console.log(`📝 Release Notes: ${RELEASE_NOTES_PATH}`);
    console.log(`🌐 Deployed to Production\n`);
};

main();
