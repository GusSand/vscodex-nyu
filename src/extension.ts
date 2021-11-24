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

const decorationType = vscode.window.createTextEditorDecorationType({
  //color: "grey",
  backgroundColor: "white",
  border: "2px solid red"
});

// This method gets called
function decorate(editor: vscode.TextEditor, pos: vscode.Position, text: string) {

  let sourceCode = editor.document.getText();
  let position = sourceCode.search(text);
  let lines = text.split("\n");



  let range = new vscode.Range(
    pos,
    new vscode.Position(pos.line + lines.length, lines[lines.length - 1].length)
  );
  let decorationsArray: vscode.DecorationOptions[] = [];
  let decoration = { range };
  decorationsArray.push(decoration);
  editor.setDecorations(decorationType, decorationsArray);
}


async function appendCurrentSelection(context: vscode.ExtensionContext) : Promise<string> {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {return  '';} // No open text editor
    const doc = editor.document;
    const pos = editor.selection.active;
    const text = doc.getText(new vscode.Range(new vscode.Position(0, 0), pos));

    let suggestionText: string = ''; 

    
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

                const openEditor = vscode.window.visibleTextEditors.filter(
                  editor => editor.document.uri === doc.uri
                )[0];
                decorate(openEditor, pos, completion);

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

  
  

// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let timer = undefined;
    let output: vscode.CompletionItem[] | undefined = undefined;

    storeDefaultLevel(context, 'function-level');


    vscode.workspace.onWillSaveTextDocument((e) => {
      appendCurrentSelection(context);
    });

    // vscode.workspace.onWillSaveTextDocument(event => {
    //     const openEditor = vscode.window.visibleTextEditors.filter(
    //       editor => editor.document.uri === event.document.uri
    //     )[0];
    //     decorate(openEditor);
    //   });
    

    // const predict2 = vscode.languages.registerCompletionItemProvider('c',  {
		// provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, compcontext: vscode.CompletionContext) {
    //         return [new vscode.CompletionItem('predict')];
    //         //appendCurrentSelection(context);
    //     }
    // });
    

    // const predict = vscode.commands.registerCommand("vscodex.predict", async function() {
    // 	appendCurrentSelection(context);
    // });

    //context.subscriptions.push(predict);

    // const setLevelAndPredict = vscode.commands.registerCommand("vscodex.setLevelAndPredict", async function() {
    //     await pickAndSetLevel(context);
    //     appendCurrentSelection(context);
    // });

  }

// this method is called when the extension is deactivated
export function deactivate() {}
