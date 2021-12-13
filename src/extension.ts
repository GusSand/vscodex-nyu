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
  color: "grey",
  //backgroundColor: "white",
  //border: "2px solid red"
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


async function getSuggestionsOld(context: vscode.ExtensionContext, text: string) : Promise<string[]> {

    // const editor = vscode.window.activeTextEditor;
    // if (!editor) {return  '';} // No open text editor
    // const doc = editor.document;
    // const pos = editor.selection.active;
    // const text = doc.getText(new vscode.Range(new vscode.Position(0, 0), pos));

    
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

                return completion;
 
        });
	});

}

async function getSuggestions(context: vscode.ExtensionContext, text: string) : Promise<string> {

  // const editor = vscode.window.activeTextEditor;
  // if (!editor) {return  '';} // No open text editor
  // const doc = editor.document;
  // const pos = editor.selection.active;
  // const text = doc.getText(new vscode.Range(new vscode.Position(0, 0), pos));

  
  // Display a progress bar while fetching the response

          
    await getNextTokens(text, getDefaultConfig(context), getApiKey())
    .catch((error) => {
        vscode.window.showErrorMessage(error.toString());
        return "error";
    })
    .then((completion) => {
        return completion;

  }
   return 'foo';
    ) ;





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

// this method is called when your extension is activated
// 

// interface CustomInlineCompletionItem extends vscode.InlineCompletionItem {
//     trackingId: string;
// }

function isAtEndOfLine() {

  const editor = vscode.window.activeTextEditor;
  if (!editor) {return  '';} // No open text editor

  const doc = editor.document;
  const pos = editor.selection.active;

  //const start = range.end;
  const line = doc.lineAt(pos);
  return line.text[pos.character] === ';' || line.text[pos.character] === '\n';
}


// this method is called when the extension is activated
// your extension is activated the very first time the command is executed
export function activate(vscontext: vscode.ExtensionContext) {

    // let timer: any; 
    // let output: vscode.CompletionItem[] | undefined = undefined;

    // storeDefaultLevel(context, 'function-level');


    // vscode.workspace.onWillSaveTextDocument((e) => {
    //   appendCurrentSelection(context);
    // });

    const disposable =  vscode.commands.registerCommand(
      'extension.inline-completion-settings',
      () => {
        vscode.window.showInformationMessage('Show settings');
      }
    );
  
    vscontext.subscriptions.push(disposable);
  
    const allSuggestions = [
      'helloworld1',
      `if (n < 2) {
    return 1;
  }
  return fib(n - 1) + fib(n - 2);`,
      `if (n < 3) {
    if (n < 2) {
      return 1;
    }
    return 1;
  }
  return fib(n - 1) + fib(n - 2);`,
    ];
  
    function longestSuffixPrefixLength(a: string, b: string): number {
      for (let i = Math.min(a.length, b.length); i > 0; i--) {
        if (a.substr(-i) == b.substr(0, i)) {
          return i;
        }
      }
      return 0;
    }
  
    interface CustomInlineCompletionItem extends vscode.InlineCompletionItem {
      trackingId: string;
    }
  
    const provider: vscode.InlineCompletionItemProvider<CustomInlineCompletionItem> = {
      provideInlineCompletionItems: async (document, position, context, token) => {
        const textBeforeCursor = document.getText(
          new vscode.Range(position.with(undefined, 0), position)
        );
  
        // if (!isAtEndOfLine()) {
        //   return;
        // }
        // else {
        //   showMessageBox({'at the end of line': true});
        // }

        // You can use the await keyword to convert a promise
        // into its value. Today, these only work inside an async
        // function.
        const asyncFunc = async () => [":wave:",":smile:"];
        let myPromiseString = asyncFunc();

        const myWrapperFunction = async () => {
          
          const myPromiseString = asyncFunc();
          try {
            const completion = await getNextTokens(text, getDefaultConfig(vscontext), getApiKey());
            // Via the await keyword, now myResolvedPromiseString
            // is a string
            const myPromiseString = completion;
          }
          catch (error) {
            vscode.window.showErrorMessage(error.toString());
          }
          return  completion;
        };

        allSuggestions = myPromiseString; 

        // if (context.triggerKind === vscode.InlineCompletionTriggerKind.Explicit) {
        //   (await suggestions).push('if (n < 1000) {\n}', 'helloworld2');
        //   await new Promise((r) => setTimeout(r, 1000));
        // }
  
        const items = new Array<CustomInlineCompletionItem>();
        for (const s of await suggestions) {
          const l = longestSuffixPrefixLength(textBeforeCursor, s);
          if (l > 0) {
            items.push({
              text: s,
              range: new vscode.Range(position.translate(0, -l), position),
              trackingId: 'some-id',
            });
          }
        }
        return { items };
      },
    };
  
    vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider);
  
    // Be aware that the API around `getInlineCompletionItemController` will not be finalized as is!
    vscode.window.getInlineCompletionItemController(provider).onDidShowCompletionItem(e => {
      const id = e.completionItem.trackingId;
    });


    //context.subscriptions.push(predict);

    
  }

// this method is called when the extension is deactivated
export function deactivate() {}
function showMessageBox(arg0: { 'at the end of line': boolean; }) {
  throw new Error("Function not implemented.");
}

