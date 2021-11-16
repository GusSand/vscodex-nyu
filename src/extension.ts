/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from "vscode";

import {getNextTokens} from "./openai_api";
import {getApiKey, getDefaultConfig} from "./config";
import {getSelection} from "./context";
import {storeDefaultLevel} from "./storage";

// import superagent from 'superagent';
const superagent = require("superagent");

//Create output channel
const vscodexOut = vscode.window.createOutputChannel("vscodex");

async function appendCurrentSelection(context: vscode.ExtensionContext) : Promise<string> {

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return '';
    }

    const doc = editor.document;
    const pos = editor.selection.active;
    const text = doc.getText(new vscode.Range(new vscode.Position(0, 0), pos));

    let suggestionText: string = ''; 

    // let selectionObj = getSelection();
    // if (!selectionObj || !selectionObj.selection || !selectionObj.text)
    // {
    //     vscode.window.showWarningMessage("No text selected! Please select some text.");
    //     return;
    // }
    // let selection = selectionObj.selection;
    // let text = selectionObj.text;

    // Display a progress bar while fetching the response


    // Display a progress bar while fetching the response
	vscode.window.withProgress({
        cancellable: true,
		location: vscode.ProgressLocation.Notification,
		title: "VSCodex",
	},
    async (progress, cancelToken) => {

        progress.report({
            message: "Request sent, waiting the response..."
            });
            
            await getNextTokens(text, getDefaultConfig(context), getApiKey())
            .catch((error) => {
                vscode.window.showErrorMessage(error.toString());
            })
            .then((completion) => {

                // Do not edit selection if the user requested cancelation
                if (cancelToken.isCancellationRequested || !completion) {
                    return;
                }

                // if (vscode.window.activeTextEditor) {
                //     vscode.window.activeTextEditor.edit(editBuilder => {
                //         editBuilder.insert(selection.end, completion);
                //     });
                // }

                editor.edit((editBuilder) => {
                    editBuilder.insert(pos, completion);
                });

                // const textCompletion = new vscode.CompletionItem("text");
                // textCompletion.kind = vscode.CompletionItemKind.Text;
                // textCompletion.insertText =  completion; 
                // suggestionText = completion;

        });
	});
    
    return suggestionText;

}

/**
 * User select a "prediction size level", between function-level, class-level, and file-level.
 * Each level contains stop keyword, for example in python: \
 * * line-level: `stop = ["\n"]`
 * * function-level: `stop = ["def", "@"]`
 * * class-level: `stop = ["class"]`
 * * file-level: `stop = []`
 * 
 * Sent stop sequence is the sum of all stop sequence of upper level.
 * In the previous example, if function-level is selected, stop sequence will be ["def", "@", "class"]
 */
async function pickAndSetLevel(context: vscode.ExtensionContext) {
    let choice = await vscode.window.showQuickPick(["Function", "Class", "File", "Custom"],
                                                   {placeHolder: "Select a completion level."});
    if (choice) {
        storeDefaultLevel(context, choice);
    }
}

// provider1 = async () => { }.languages.registerCompletionItemProvider('language:c', {
//     provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

//         const textCompletion = new vscode.CompletionItem("text");
//         textCompletion.kind = vscode.CompletionItemKind.Text;
//         let theText : string = await appendCurrentSelection(context);
//         textCompletion.insertText =  theText;

//         return [
//             textCompletion,
//         ];
//     }
// });



// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let timer = undefined;
    let output: vscode.CompletionItem[] | undefined = undefined;


	const provider2 = vscode.languages.registerCompletionItemProvider('c', {

		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            // clearTimeout(timer);
			// timer = setTimeout(function() {
			// 	// a simple completion item which inserts `Hello World!`
			// 	const simpleCompletion = new vscode.CompletionItem('Hello World!');

			// 	output = [
			// 		simpleCompletion,
			// 	];

			// }, 1000);
            // a completion item that inserts its text as snippet,
			// the `insertText`-property is a `SnippetString` which will be
			// honored by the editor.

            // a completion item that can be accepted by a commit character,
			// the `commitCharacters`-property is set which means that the completion will
			// be inserted and then the character will be typed.
			const commitCharacterCompletion = new vscode.CompletionItem('console');
			commitCharacterCompletion.commitCharacters = ['.'];
			commitCharacterCompletion.documentation = new vscode.MarkdownString('Press `.` to get `console.`');

			const snippetCompletion = new vscode.CompletionItem('Good part of the day');
			snippetCompletion.insertText = new vscode.SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?');
			snippetCompletion.documentation = new vscode.MarkdownString("Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting.");

            output =[
                snippetCompletion,
                commitCharacterCompletion
            ];

			return output;
		}
	});
    

	const predict = vscode.commands.registerCommand("vscodex.predict", async function() {
		appendCurrentSelection(context);
	});

    context.subscriptions.push(provider2);

    const setLevelAndPredict = vscode.commands.registerCommand("vscodex.setLevelAndPredict", async function() {
        await pickAndSetLevel(context);
        appendCurrentSelection(context);
    });
}

// this method is called when the extension is deactivated
export function deactivate() {}
