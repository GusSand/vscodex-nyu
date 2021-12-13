# VSCodex-NYU

Visual Studio Code extension to support the new codex API by OpenAI.
This extension is based on some of the code for VSCodex by https://github.com/VincentHch

An *API key* (access token) is required in order to use this extension. This token is issued by OpenAI and must be in an environment variable named `OPENAI_API_KEY`. You can alternatively specify the API key in the extension settings although this might be less secure, and is generally discouraged.

```
echo 'export OPENAI_API_KEY=********' >> ~/.bashrc
```

## Testing/Running  Extension

To test this extension you will need to use the insiders build of VsCode. You can install from https://code.visualstudio.com/insiders/

This version of the codex extension uses the proposed `InlineCompletion` interface. You can read more about it here but it seems that the VsCode team doesn't plan to make a release of it anytime soon. 

```
1. Install at least version 1.63 of VSCode Insiders. 
2. Change the "enableProposedApi": true to "enabledApiProposals": [ "inlineCompletions" ] in the package.json file. 
3. Run npm i vscode-dts to download the latest version of vscode-dts 
4. Run npx vscode-dts dev.
```

## Building extension

```
npm install -g vsce
npm install
vsce package
code --install-extension *.vsix
```

## Features

https://user-images.githubusercontent.com/48289861/131251824-f8ffc248-fd96-4792-8df6-a5fc779eb03d.mov

### Complete snippet (`vscodex.predict`)
**Shortcut**: `ctrl+enter`

### Set level and complete snippet
**Shortcut**: `ctrl+shift+enter`

To avoid predicting more code than needed, stop-sequences can be specified like `class`. A level can be set and modified in the extension.
* Function-level: will only complete your function
* Class-level: will only complete your class
* File-level: No restrictions
* Custom-level: User specified stop sequence.




