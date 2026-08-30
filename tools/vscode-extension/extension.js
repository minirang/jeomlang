const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

let terminal;

function activate(context) {
    const runCommand = vscode.commands.registerCommand('jeom.runFile', uri => {
        runJeom(context, uri, 'run');
    });

    const checkCommand = vscode.commands.registerCommand('jeom.checkFile', uri => {
        runJeom(context, uri, 'check');
    });

    const codeLensProvider = vscode.languages.registerCodeLensProvider(
        { language: 'jeom', scheme: 'file' },
        new JeomCodeLensProvider()
    );

    const closeTerminalWatcher = vscode.window.onDidCloseTerminal(closedTerminal => {
        if (closedTerminal === terminal) terminal = undefined;
    });

    context.subscriptions.push(runCommand, checkCommand, codeLensProvider, closeTerminalWatcher);
}

function deactivate() { }

class JeomCodeLensProvider {
    provideCodeLenses(document) {
        const config = vscode.workspace.getConfiguration('jeom');
        if (!config.get('showCodeLens', true)) return [];

        const range = new vscode.Range(0, 0, 0, 0);
        return [
            new vscode.CodeLens(range, {
                title: 'Run JEOM',
                command: 'jeom.runFile',
                arguments: [document.uri]
            }),
            new vscode.CodeLens(range, {
                title: 'Check JEOM',
                command: 'jeom.checkFile',
                arguments: [document.uri]
            })
        ];
    }
}

async function runJeom(context, uri, mode) {
    const targetUri = resolveTargetUri(uri);
    if (!targetUri) {
        vscode.window.showWarningMessage('Open a .jeom file before running JEOM.');
        return;
    }

    const filePath = targetUri.fsPath;
    if (path.extname(filePath).toLowerCase() !== '.jeom') {
        vscode.window.showWarningMessage('The active file is not a .jeom file.');
        return;
    }

    const document = await vscode.workspace.openTextDocument(targetUri);
    if (document.isDirty) await document.save();

    const cwd = resolveCwd(targetUri);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
    const workspacePath = workspaceFolder ? workspaceFolder.uri.fsPath : '';
    const cliPath = resolveCliPath(context, targetUri, workspacePath);
    const commandBody = resolveCommandBody(mode, {
        cliPath,
        filePath,
        workspacePath
    });

    if (!commandBody) return;

    const isWindows = process.platform === 'win32';
    const command = isWindows
        ? buildWindowsCommand(cwd, commandBody)
        : buildUnixCommand(cwd, commandBody);

    terminal = terminal || createJeomTerminal(isWindows);
    terminal.show(true);
    terminal.sendText(command);
}

function createJeomTerminal(isWindows) {
    return vscode.window.createTerminal({
        name: 'JEOM',
        shellPath: isWindows ? undefined : '/bin/bash',
        env: {
            NODE_OPTIONS: '',
            VSCODE_INSPECTOR_OPTIONS: ''
        }
    });
}

function buildWindowsCommand(cwd, commandBody) {
    return [
        `$env:NODE_OPTIONS=''`,
        `$env:VSCODE_INSPECTOR_OPTIONS=''`,
        `Set-Location -LiteralPath ${quoteForPowerShell(cwd)}`,
        commandBody
    ].join('; ');
}

function buildUnixCommand(cwd, commandBody) {
    return [
        `export NODE_OPTIONS=''`,
        `export VSCODE_INSPECTOR_OPTIONS=''`,
        `cd ${quoteForBash(cwd)}`,
        commandBody
    ].join('; ');
}

function resolveTargetUri(uri) {
    if (uri && uri.fsPath) return uri;
    const editor = vscode.window.activeTextEditor;
    return editor ? editor.document.uri : undefined;
}

function resolveCliPath(context, targetUri, workspacePath) {
    const configured = vscode.workspace.getConfiguration('jeom').get('cliPath', '').trim();

    if (configured) {
        return configured
            .replace(/\$\{workspaceFolder\}/g, workspacePath)
            .replace(/\//g, path.sep);
    }

    const candidates = buildCliCandidates(context.extensionPath, workspacePath);
    const found = candidates.find(candidate => fs.existsSync(candidate));
    return found || path.join(context.extensionPath, 'official', 'cli.js');
}

/** @returns {string[]} jeomlang monorepo (core/) then standalone bundle (official/) */
function buildCliCandidates(extensionPath, workspacePath) {
    const rel = (base, ...parts) => (base ? path.join(base, ...parts) : '');
    return [
        rel(workspacePath, 'core', 'cli.js'),
        rel(workspacePath, 'official', 'cli.js'),
        rel(extensionPath, 'core', 'cli.js'),
        rel(extensionPath, 'official', 'cli.js')
    ].filter(Boolean);
}

function resolveCommandBody(mode, vars) {
    const config = vscode.workspace.getConfiguration('jeom');
    const settingName = mode === 'check' ? 'checkCommand' : 'runCommand';
    const template = config.get(settingName, '').trim();

    if (template) {
        return expandCommandTemplate(template, {
            ...vars,
            mode
        });
    }

    if (!fs.existsSync(vars.cliPath)) {
        vscode.window.showErrorMessage(`JEOM CLI was not found: ${vars.cliPath}`);
        return undefined;
    }

    const isWindows = process.platform === 'win32';
    const quote = isWindows ? quoteForPowerShell : quoteForBash;

    return `node ${quote(vars.cliPath)} ${mode} ${quote(vars.filePath)}`;
}

function expandCommandTemplate(template, vars) {
    const isWindows = process.platform === 'win32';
    const quote = isWindows ? quoteForPowerShell : quoteForBash;

    const replacements = {
        '${file}': quote(vars.filePath),
        '${filePath}': quote(vars.filePath),
        '${workspaceFolder}': quote(vars.workspacePath),
        '${cliPath}': quote(vars.cliPath),
        '${mode}': vars.mode
    };

    return Object.entries(replacements).reduce(
        (command, [placeholder, value]) => command.split(placeholder).join(value),
        template
    );
}

function resolveCwd(targetUri) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
    if (workspaceFolder) return workspaceFolder.uri.fsPath;
    return path.dirname(targetUri.fsPath);
}

function quoteForPowerShell(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
}

function quoteForBash(value) {
    return `'${String(value).replace(/'/g, "'\"'\"'")}'`;
}

module.exports = {
    activate,
    deactivate
};
