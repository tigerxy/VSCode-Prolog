import * as vscode from 'vscode';
let i18next = require('i18next');
export module prolog
{
    export class prolog
    {
        private spawn = require('child_process').spawn
        private prolog
        private output: vscode.OutputChannel
        public consultedFile = ""
        public lastQuery = ""

        constructor()
        {
            switch (process.platform) {
                case 'win32':
                    this.prolog = this.spawn('C:\Program Files\swipl\bin\swipl.exe', ['-q'])
                    break;
                case 'linux':
                    this.prolog = this.spawn('swipl', ['-q'])
                    break;
            
                default:
                    throw "Plattform not supported.";
            }

            this.prolog.stdout.on('data', (data: Buffer) =>
            {
                this.output.append(data.toString().trim())
            })

            this.prolog.stderr.on('data', (data: Buffer) =>
            {
                this.output.append(data.toString().trim())
            })

            this.prolog.on('close', (code) =>
            {
                this.output.appendLine(`child process exited with code ${code}`)
            })

            this.output = vscode.window.createOutputChannel("Prolog")
            this.output.show()
        }
        private write(str: string): Promise<string>
        {
            return new Promise((resolve, reject) =>
            {
                this.prolog.stdin.write(str)
                this.prolog.stdout.on('data', (data: Buffer) =>
                {
                    resolve(data.toString())
                })
                this.prolog.stderr.on('data', (data: Buffer) =>
                {
                    reject(data.toString())
                })
            })
        }

        public consultFile(path: vscode.Uri)
        {
            this.consultedFile = path.fsPath
            this.output.appendLine(`\n?- consult('${path.fsPath}').`)
            this.write(`consult("${path.fsPath}").\n`)
        }
        public sendQuery(query: string)
        {
            this.output.appendLine(`\n?- ${query}`)
            this.write(query + '\n')
                .then((msg: string) =>
                {
                    if (!msg.trim().endsWith("."))
                        this.continueQueryMessage()
                })
        }

        public endProgram()
        {
            this.prolog.kill('SIGHUP')
        }
        public continueQueryMessage()
        {

            vscode.window.showInformationMessage<infoContinueQueryExecSelection>(i18next.t("continueQueryExec"), {
                title: i18next.t("no"),
                selection: yesNoCancel.no
            },{
                title: i18next.t("yes"),
                selection: yesNoCancel.yes
            }).then((value: infoContinueQueryExecSelection) =>
            {
                if (value.selection == yesNoCancel.yes)
                {
                    this.output.appendLine(";")
                    this.write(';\n')
                        .then((msg: string) =>
                        {
                            if (!msg.trim().endsWith("."))
                                this.continueQueryMessage()
                        })
                }
                else
                {
                    this.output.appendLine(".")
                    this.prolog.stdin.write('.\n')
                }
            })
        }
    }
    enum yesNoCancel
    {
        yes,
        no,
        cancel
    }
    interface infoContinueQueryExecSelection extends vscode.MessageItem
    {
        selection: yesNoCancel
    }
}