import 'mocha'
import chai from 'chai'
import { spawn } from 'child_process'
import { join } from 'path'

const expect = chai.expect;

const subprocess = (script: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const child = spawn(
            process.execPath,
            ["-r", "ts-node/register", join(__dirname, "TestScripts", script)],
            { detached: true }
        )

        let op: string = "";

        child.stdout.on("data", chunk => op += chunk)
        child.on('close', () => resolve(op))
        child.on('error', err => reject(err))
    })
}

let attached: string, detached: string, unsubscribed: string;

describe('CleanupManager Class', () => {
    before(async function () {
        this.timeout(5000);
        [attached, detached, unsubscribed] = await Promise.all([
            subprocess("attach.ts"),
            subprocess("detach.ts"),
            subprocess("unsubscribe.ts")
        ]);
    })

    describe('#attach', () => {
        it("should run all the passed callbacks", () => {
            expect(attached).to.equal("op1\nop2\nop3\n")
        })
    })

    describe('#detach', () => {
        it("should run only the currently attached callbacks", () => {
            expect(detached).to.equal("op1\nop3\n")
        })
    })

    describe("#unsubscribe", () => {
        it("should run no callback", () => {
            expect(unsubscribed).to.equal("")
        })
    })
})
