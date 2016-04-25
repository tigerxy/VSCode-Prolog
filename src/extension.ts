'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {prolog} from './prolog';
let i18next = require('i18next');
let pl: prolog.prolog;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{
	i18next.init({
		"debug": false,
		"lng": vscode.env.language,
		"backend": {
			"loadPath": "locales/{{lng}}.json"
		},
		"fallbackLng": "en-US"
	});
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "prolog" is now active!');
	pl = new prolog.prolog()
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let consult = vscode.commands.registerCommand('extension.consult', () =>
	{
		var doc = vscode.window.activeTextEditor.document
		if (doc != undefined)
		{
			if (doc.fileName.endsWith(".pl"))
			{
				pl.consultFile(vscode.window.activeTextEditor.document.uri)
			}
			else
			{
				vscode.window.showErrorMessage(i18next.t("notProlog"))
			}
		}
		else
		{
			vscode.window.showErrorMessage(i18next.t("noFile"))
		}
	});
	let query = vscode.commands.registerCommand('extension.query', () =>
	{
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		var doc = vscode.window.activeTextEditor.document
		if (doc != undefined)
		{
			if (doc.fileName.endsWith(".pl"))
			{
				if (pl.consultedFile != vscode.window.activeTextEditor.document.uri.fsPath)
					pl.consultFile(vscode.window.activeTextEditor.document.uri)

				vscode.window.showInputBox({
					validateInput: (value: string) =>
					{
						if (!value.endsWith("."))
							return i18next.t("queryEndDot")
						return ""
					},
					prompt: i18next.t("insertPrologQuery"),
					value: pl.lastQuery
				}).then((value: string) =>
				{
					if (value != undefined)
					{
						pl.lastQuery = value
						pl.sendQuery(value)
					}
				})
			}
			else
			{
				vscode.window.showErrorMessage(i18next.t("notProlog"))
			}
		}
		else
		{
			vscode.window.showErrorMessage(i18next.t("noFile"))
		}
	});
	let onsave = vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) =>
	{
		if (e.fileName.endsWith(".pl"))
		{
			pl.consultFile(e.uri)
		}
	})

	context.subscriptions.push(consult, query, onsave);
}

// this method is called when your extension is deactivated
export function deactivate()
{
	if (pl != undefined)
		pl.endProgram()
}

