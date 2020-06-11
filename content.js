chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "checkStatus") {
            checkStatus().then((result) => {
                console.log(result.project)
                sendResponse({status: result.project})
            })
        }
        if (request.action == "setStatus") {
            setStatus(request.projectObject)
            addCase(request.projectObject)
            sendResponse({status: "Success"})
        }
        if (request.action == "logLine") {
            logLine(request.logObject)
            sendResponse({status: "Logged"})
        }
        if (request.action == "clear") {
            clearLog(request.case_name)
            chrome.storage.local.set({project: "fresh"})
            sendResponse({status: "Cleared"})
        }
        if (request.action == "download") {
            getLines().then((fetchedLogLines) => {
                sendResponse({status: fetchedLogLines.lines})
            })
        }
        if (request.action == "cache") {
            rememberFields(request.what, request.why, request.result)
        }
        if (request.action == "getCached") {
            getFields().then((cached) => {
                sendResponse({status: cached})
            })
        }
        if (request.action == "getCases") {
            getCases().then((cases_list) => {
                console.log(cases_list)
                sendResponse({status: cases_list})
            })
        }
        if (request.action == "importCase") {
            console.log("Got it")
            importCase(request.logs)
            sendResponse({status: "Success"})
        }
        if (request.action == "setCase") {
            getCases().then((cases_list) => {
                for (record of cases_list) {
                    if (record.project == request.case_name) {
                        sendResponse({status: record})
                    }
                }
                sendResponse({status: "Case does not exist"})
            })
        }
        return true
})

async function clearLog(case_name) {
    var keptLogs = [];
    getLines().then((lines) => {
        console.log(lines.lines)
        for (line of lines.lines) {
            if (line.case != case_name) {
                keptLogs.push(line)
            }
        }
        chrome.storage.local.set({lines: keptLogs})
    })
}

async function checkStatus() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['project'], (result) => {
            resolve(result)
        })
    })
}

async function setStatus(projectObject) {
    chrome.storage.local.set({project: projectObject})
}

async function importCase(file) {
    var newlines = [];
    var lines = file.split('\n');
    var derivedProject = lines[1].split("\t")
    var projectObject = {
        "name": derivedProject[0],
        "location": derivedProject[1],
        "file_location": "None",
        "project": derivedProject[9]
    }
    setStatus(projectObject)
    addCase(projectObject)
    getLines().then((existingLines) => {
        console.log(existingLines.lines)
        for (existingLine of existingLines.lines) {
            newlines.push(existingLine)
        }
        for(var line = 0; line < lines.length; line++){
            console.log(lines[line])
            var rawLine = lines[line].split("\t")
            var logObject = {
                "who": rawLine[0],
                "where": rawLine[1],
                "when": rawLine[2],
                "what": rawLine[3],
                "why": rawLine[4],
                "how": rawLine[5],
                "query": rawLine[6],
                "url": rawLine[7],
                "result": rawLine[8],
                "case": rawLine[9],
            }
            newlines.push(logObject)
        }
        chrome.storage.local.set({lines: newlines})
    })
    

}

async function getCases() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['cases'], (result) => {
            resolve(result.cases)
        })
    })
}

function addCase(projectObject) {
    var active_cases = [];
    getCases().then((cases_list) => {
        console.log(cases_list)
        if (cases_list == undefined || cases_list.length == 0) {
            chrome.storage.local.set({cases: [projectObject]})
            
        } else {
            for (record of cases_list) {
                console.log(record)
                active_cases.push(record) 
            }
            active_cases.push(projectObject);
            chrome.storage.local.set({cases: active_cases})
        }
      console.log(active_cases)  
    })
}

function rememberFields(what, why, result) {
    chrome.storage.local.set({cached: {what: what, why:why, result: result}})
}

function getFields() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['cached'], (result) => {
            resolve(result.cached)
        })
    })
}

async function logLine(logObject) {
    var referer;
    var searchQuery;
    var url = window.location.origin;
    console.log(url)
    try {
        if (url.includes("google")) {
            console.log("found google in url")
            searchQuery = document.getElementsByClassName("gLFyf gsfi")[0].value;
            console.log(searchQuery)
        }
        else if (url.includes("bing")) {
            searchQuery = document.getElementById("sb_form_q").value;
        }
        else if (url.includes("yahoo")) {
            searchQuery = document.getElementById("yschsp").value
        }
        else if (url.includes("duckduckgo")) {
            searchQuery = document.getElementById("search_form_input").value;
        }
        else {
            searchQuery = "Nvt"
        }
    } catch (error) {
        alert("An error occurred getting the current search query. The record has not been logged.")
        return
    }
    
    if (document.referrer == "") {
        referer = "Directe URL invoer"
    } else {
        referer = `Verwezen door: ${document.referrer}`
    }
    var addedObject = {
        "who": logObject.who,
        "where": logObject.where,
        "when": logObject.when,
        "what": logObject.what,
        "why": logObject.why,
        "how": referer,
        "query": searchQuery,
        "url": logObject.url,
        "result": logObject.result,
        "case": logObject.case,
        "screenshot": logObject.screenshot,
        "cocadd": logObject.cocadd
    }
    var logLines = []
    var fetchedLogLines = await getLines()
    console.log(fetchedLogLines.lines)
    if (fetchedLogLines.lines == undefined) {
        logLines.push(addedObject)
        chrome.storage.local.set({lines: logLines})
        console.log({lines: logLines})
    } else {
        for (line of fetchedLogLines.lines) {
            console.log(line)
            logLines.push(line)
        }
        logLines.push(addedObject)
        chrome.storage.local.set({lines: logLines})
        console.log({lines: logLines})
    }
    
}

async function getLines() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['lines'], (result) => {
            resolve(result)
        })
    })
}

// hash van base64 kan, maar lijkt me een beetje kut om mee te werken
async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder('utf-8').encode(message);                    

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
}
