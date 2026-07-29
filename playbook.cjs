const { execSync } = require('child_process');
const path = require('path');

const ROOT = __dirname;
console.log('==========================================');
console.log('  《昨日重现》一键 Playbook');
console.log('==========================================\n');

// 1. Build
console.log('[1/3] 构建...');
try {
  execSync('node build.cjs', { cwd: ROOT, stdio: 'pipe' });
  console.log('  ✅ 构建完成');
} catch (e) {
  console.log('  ❌ 构建失败:', e.message);
  process.exit(1);
}

// 2. Copy build to .publish
console.log('[2/3] 准备发布产物...');
try {
  execSync('rm -rf .publish && cp -r build_out .publish', { cwd: ROOT, stdio: 'pipe' });
  console.log('  ✅ .publish/ 就绪');
} catch (e) {
  console.log('  ❌ 准备失败:', e.message);
}

// 3. Zip for 抖音
console.log('[3/3] 打包 zip...');
try {
  execSync('cd .publish && zip -r ../ye.zip . -x "*.DS_Store" "__MACOSX/*"', { cwd: ROOT, stdio: 'pipe' });
  const stats = require('fs').statSync(path.join(ROOT, 'ye.zip'));
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`  ✅ ye.zip (${sizeMB} MB)`);
} catch (e) {
  console.log('  ❌ 打包失败:', e.message);
}

console.log('\n==========================================');
console.log('  产物就绪: build_out/ + ye.zip');
console.log('  本地预览: cd build_out && npx serve .');
console.log('==========================================');
