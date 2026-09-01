#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// pushme-server npm 包内的源文件目录（即项目根目录）
const PUSHME_PKG = path.resolve(__dirname, '..');

// 颜色输出
const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};

const log = {
    info: (msg) => console.log(`${c.blue}›${c.reset} ${msg}`),
    success: (msg) => console.log(`${c.green}✔${c.reset} ${msg}`),
    warn: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
    error: (msg) => console.log(`${c.red}✖${c.reset} ${msg}`)
};

// 从 package.json 的 files 字段获取需要复制的目录/文件（排除 ! 开头的项）
const pkg = require(path.join(PUSHME_PKG, 'package.json'));
const COPY_ITEMS = pkg.files.filter(f => !f.startsWith('!'));

/**
 * 递归复制目录
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * 校验目标目录是否安全（禁止路径穿越）
 */
function isSafeTargetDir(dir) {
    if (!dir || dir === '.') return true;
    return !dir.split(/[\\/]/).includes('..');
}

/**
 * 初始化项目到指定目录
 */
function init(targetDir) {
    const isInPlace = targetDir === '.';
    const targetName = isInPlace ? path.basename(process.cwd()) : path.basename(targetDir);
    const targetPath = isInPlace ? process.cwd() : path.resolve(targetDir);

    console.log('');
    console.log(`  ${c.cyan}PushMe Server${c.reset} - 消息推送服务`);
    console.log(`  ${c.dim}────────────────────────────${c.reset}`);
    console.log('');

    if (isInPlace) {
        log.info(`在当前目录初始化: ${c.cyan}${targetName}/${c.reset}`);
    } else {
        // 检查目标目录是否为空
        if (fs.existsSync(targetPath) && fs.readdirSync(targetPath).length > 0) {
            log.error(`目录 "${targetName}" 已存在且不为空`);
            process.exit(1);
        }
        fs.mkdirSync(targetPath, { recursive: true });
        log.info(`创建项目目录: ${targetName}/`);
    }

    // 复制项目文件
    for (const item of COPY_ITEMS) {
        const src = path.join(PUSHME_PKG, item);
        const dest = path.join(targetPath, item);
        if (!fs.existsSync(src)) {
            log.warn(`跳过不存在的文件: ${item}`);
            continue;
        }
        // 目标已存在则跳过
        if (fs.existsSync(dest)) {
            log.warn(`已存在，跳过: ${item}`);
            continue;
        }
        if (fs.statSync(src).isDirectory()) {
            copyDir(src, dest);
        } else {
            fs.copyFileSync(src, dest);
        }
        log.success(`复制: ${item}`);
    }

    // 创建 config.demo 目录（供参考使用）
    const configSrc = path.join(PUSHME_PKG, 'config');
    const configDemoDest = path.join(targetPath, 'config.demo');
    if (!fs.existsSync(configDemoDest) && fs.existsSync(configSrc)) {
        copyDir(configSrc, configDemoDest);
        log.success('复制: config.demo/');
    }

    // 安装依赖
    console.log('');
    log.info('正在安装依赖（这可能需要几分钟）...');
    try {
        // 修改 package.json，移除 bin 字段（用户项目不需要）
        const pkgPath = path.join(targetPath, 'package.json');
        const pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        delete pkgData.bin;
        fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n');

        execSync('npm install', { cwd: targetPath, stdio: 'inherit' });
        log.success('依赖安装完成');
    } catch (e) {
        log.error('依赖安装失败，请稍后手动执行: npm install');
    }

    // 完成提示
    console.log('');
    console.log(`  ${c.green}✔ 项目初始化完成！${c.reset}`);
    console.log('');
    console.log(`  ${c.dim}接下来：${c.reset}`);
    console.log('');
    if (!isInPlace) {
        console.log(`    ${c.cyan}cd ${targetName}${c.reset}`);
    }
    console.log(`    ${c.cyan}npx pushme-server start${c.reset}`);
    console.log('');
    console.log(`  启动后访问 ${c.cyan}http://localhost:3010${c.reset} 访问管理面板`);
    console.log('');
}

/**
 * 启动服务
 */
function start() {
    // 检查是否在 pushme-server 项目目录中
    const serverFile = path.resolve('server.js');
    const packageFile = path.resolve('package.json');

    if (!fs.existsSync(serverFile)) {
        log.error('当前目录不是 pushme-server 项目，请先运行: npx pushme-server init');
        process.exit(1);
    }

    // 检查 package.json 确认是 pushme-server 项目
    if (fs.existsSync(packageFile)) {
        try {
            const pkgData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
            if (pkgData.name !== 'pushme-server' && !pkgData.dependencies?.['jj.js']) {
                log.warn('当前目录可能不是 pushme-server 项目');
            }
        } catch (e) {
            // 忽略解析错误
        }
    }

    log.info('正在启动 PushMe Server...');
    console.log('');

    require(serverFile);
}

/**
 * 显示帮助
 */
function help() {
    console.log('');
    console.log(`  ${c.cyan}PushMe Server${c.reset} - 消息推送服务`);
    console.log('');
    console.log('  用法:');
    console.log(`    ${c.cyan}npx pushme-server init [项目名]${c.reset}   创建项目（不指定则在当前目录初始化）`);
    console.log(`    ${c.green}npx pushme-server start${c.reset}            启动推送服务`);
    console.log('');
    console.log('  示例:');
    console.log(`    npx pushme-server init mypush    # 在 mypush 目录创建项目`);
    console.log(`    npx pushme-server init           # 在当前目录初始化`);
    console.log(`    cd mypush`);
    console.log(`    npx pushme-server start          # 启动服务`);
    console.log('');
}

// 主入口
const command = process.argv[2];

if (command === 'init') {
    const targetDir = process.argv[3];
    if (targetDir) {
        if (!isSafeTargetDir(targetDir)) {
            log.error('目录名不合法：不允许包含路径穿越字符 ".."');
            process.exit(1);
        }
        init(targetDir);
    } else {
        // 动态提示用户输入
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(`  ${c.blue}›${c.reset} 请输入项目目录名 ${c.dim}(直接回车在当前目录初始化)${c.reset}: `, (answer) => {
            rl.close();
            const dir = answer.trim() || '.';
            if (!isSafeTargetDir(dir)) {
                log.error('目录名不合法：不允许包含路径穿越字符 ".."');
                process.exit(1);
            }
            init(dir);
        });
    }
} else if (command === 'start') {
    start();
} else {
    help();
}
