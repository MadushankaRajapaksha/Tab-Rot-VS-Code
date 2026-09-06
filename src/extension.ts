import * as vscode from 'vscode';


const activate = (context: vscode.ExtensionContext)=>{
    const command = vscode.commands.registerCommand(
        'tabRoot.hello',()=>{
            vscode.window.showInformationMessage('Hello World!');
        }
    )
    context.subscriptions.push(command);

};
const deactivate = ()=>{};


// function exports 
export {activate};
export {deactivate};
