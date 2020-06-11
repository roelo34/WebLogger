document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("importCsv").addEventListener("click", importCsv, false)
    document.getElementById("setScrName").addEventListener("click", setScrName, false)
    document.getElementById("fileInput").addEventListener("change", function() {
        var file = this.files[0];

        var reader = new FileReader();
        reader.onload = function(progressEvent){
            // Entire file
            var logs = this.result;
            console.log(this.result);
            // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            //     chrome.tabs.sendMessage(tabs[0].id, {action: "importCase", logs: logs}, (result) => {
            //         console.log(result)
            //     })
            // })
            importCase(logs)
        };
        reader.readAsText(file);
    }, false)

    function importCsv() {
        document.getElementById("fileInput").click();
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
                console.log(rawLine)
                var logObject = {
                    "who": rawLine[0],
                    "where": rawLine[1],
                    "when": rawLine[2],
                    "what": rawLine[3],
                    "why": rawLine[4],
                    "how": rawLine[5],
                    "result": rawLine[6],
                    "query": rawLine[7],
                    "url": rawLine[8],
                    "case": rawLine[9],
                }
                newlines.push(logObject)
            }
            chrome.storage.local.set({lines: newlines})
            document.getElementById("importSuccess").textContent = "Added case! If the case does not show up in the dropdown menu, refresh the tab."
        })
        
    
    }

    async function setStatus(projectObject) {
        chrome.storage.local.set({project: projectObject})
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

    async function getLines() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['lines'], (result) => {
                resolve(result)
            })
        })
    }

    // WIP
    // function setScrName() {
    //     var preferredName = document.getElementById("scrName").value;
    //     if (preferredName.includes("%D")) {

    //     }
    // }

    async function getCases() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['cases'], (result) => {
                resolve(result.cases)
            })
        })
    }

}, true)