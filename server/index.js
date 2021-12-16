"use strict";
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const ws = require('ws')

console.log(process.argv)

// Get port number from command line arguments
let websocketPort = parseInt(process.argv[2])
let useHTTPS = process.argv[3] !== undefined
        ? process.argv[3] === 'true'
            ? true
            : false
        : undefined
let certificatePath = useHTTPS
    ? process.argv[4]
    : undefined
let keyPath = useHTTPS
    ? process.argv[5]
    : undefined
let hostClient = useHTTPS
    ? process.argv[6] === 'true'
        ? true
        : false
    : process.argv[4] === 'true'
let httpPort = hostClient
    ? useHTTPS
        ? parseInt(process.argv[7])
        : parseInt(process.argv[5])
    : undefined
let clientPath = hostClient
    ? useHTTPS
        ? process.argv[8]
        : process.argv[6]
    : undefined

const a=()=>{if(useHTTPS){return`\nCertificate Path (file): ${certificatePath}\nKey Path (file): ${keyPath}`}else return``}

console.debug(`
===========================================================
                         ARGUMENTS
===========================================================
Websocket Port: ${websocketPort}

Use HTTPS: ${useHTTPS}${a()}
Host Client: ${hostClient}
Http Port: ${httpPort}
Client Path (folder / single file): ${clientPath}
`)

// Assert that all required arguments are present
console.debug(`Running assertions...`)
assert(websocketPort !== undefined, 'Websocket server port must be specified!')
assert(!isNaN( websocketPort ), 'Websocket server port must be a number!')
assert(hostClient !== undefined, 'Wether or not to host the client must be specified!')
if (hostClient) {
    assert(httpPort !== undefined, 'HTTP server port must be specified!')
    assert(!isNaN( httpPort ), 'HTTP server port must be a number!')
    assert(useHTTPS !== undefined, 'Wether or not to use HTTPS must be specified!')
    if (useHTTPS) {
        assert(certificatePath !== undefined, 'Certificate path must be specified!')
        assert(keyPath !== undefined, 'Key path must be specified!')
    }
    assert(clientPath !== undefined, 'Client path must be specified!')
}
console.debug(`Assertions complete\n`)

// Run http server
if(hostClient) { 
    if(useHTTPS) httpsServer()
    else httpServer()
}

function clientListener(req, res) {
    try {
        if(fs.statSync(clientPath).isDirectory()) {
            if(req.url === '/') {
                res.writeHead(302, {
                    location: 'index.html'
                })
                res.end()
                return
            }
            const data = fs.readFileSync(clientPath+req.url)
            res.write(data)
            res.end()
        } else {
            const data = fs.readFileSync(clientPath)
            res.write(data)
            res.end()
        }
    } catch(err) {
        console.error(`Error number ${err.errno} (${ err.code }) while trying to read ${err.path}`)
        if(err.errno === -4058) {
            res.writeHead(404)
            res.end()
        }
        res.writeHead(500)
        res.end()
    }
}

function httpsServer() {
    console.debug(`Starting https server`)
    const https = require('https')
    
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certificatePath)
    }

    const server = https.createServer( options, clientListener )
    server.listen( httpPort )
    console.debug(`Https server started`)
}

function httpServer() {
    console.debug(`Starting http server`)
    const http = require('http')
    const server = http.createServer( clientListener )
    server.listen( httpPort )
    console.debug(`Http server started`)
}