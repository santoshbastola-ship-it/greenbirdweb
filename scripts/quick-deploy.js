const { execSync } = require('child_process');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
    console.log('║           ⚡ QUICK PRODUCTION DEPLOYMENT                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('⚠️  WARNING: Skipping tests and release notes');
    console.log('   Use this only for hotfixes or minor changes\n');

    // 1. Build
    console.log('🔨 Step 1: Building project...');
    runCommand('npm run build', 'Build Project');

    // 1.1 Verify PWA assets
    console.log('\n📱 Step 1.1: Verifying PWA assets...');
    const fs = require('fs');
    const path = require('path');

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

    // 2. Build Functions
    console.log('\n⚙️  Step 2: Building functions...');
    runCommand('cd functions && npm install && npm run build', 'Build Functions');

    // 3. Deploy
    console.log('\n🚀 Step 3: Deploying to Firebase...');
    runCommand('npx firebase deploy --only hosting,firestore,storage', 'Firebase Deploy');

    // Success
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ QUICK DEPLOYMENT SUCCESSFUL                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('🌐 Deployed to Production');
    console.log('⚠️  Remember to update version and release notes manually\n');
};

main();
