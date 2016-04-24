import * as vscode from 'vscode';
let i18next = require('i18next');
export module prolog
{
    interface prologQueryContinue extends vscode.MessageItem
    {
        title: "continue"
    }

    export class prolog
    {
        private spawn = require('child_process').spawn
        private prolog
        private output: vscode.OutputChannel
        public lastQuery = "";
        constructor()
        {
            this.prolog = this.spawn('prolog', ['-q'])

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

            vscode.window.showInformationMessage(i18next.t("continueQueryExec"), i18next.t("yes")).then((value: string) =>
            {
                if (value == "Yes")
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
}