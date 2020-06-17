document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("submit").addEventListener("click", submit, false)
    document.getElementById("new").addEventListener("click", newcase, false)
    document.getElementById("log").addEventListener("click", log, false)
    document.getElementById("clear").addEventListener("click", clear, false)
    document.getElementById("download").addEventListener("click", download, false)
    document.getElementById("cache").addEventListener("click", cache, false)
    document.getElementById("submitCase").addEventListener("click", submitCase, false)
    document.getElementById("import").addEventListener("click", importCase, false)
    document.getElementById("autolog").addEventListener("click", autoLog, false)
    
    checkAutoLog()

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getCases"}, (result) => {
            var selector = document.getElementById("known_cases");
            try {
                console.log(result.status)
            } catch (error) {
                console.log("No cases found!")
                return
            }
            
            for (case_name of result.status) {
                var option = document.createElement("option")
                option.setAttribute("value", case_name.project)
                option.textContent = case_name.project
                selector.appendChild(option);
            }
            
        })
    })

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "checkStatus"}, (result) => {
            try {
                console.log(result.status)
            } catch (error) {
                console.log("No cases found!")
                return
            }
            if (result.status != "fresh") {
                console.log(result)
                document.getElementById("setup").style.display = "none";
                document.getElementById("active").style.display = "block";
                document.getElementById("operate").style.display = "block";
                document.getElementById("active_case").textContent = result.status.project
                document.getElementById("active_researcher").textContent = result.status.name
                document.getElementById("active_location").textContent = result.status.location
                document.getElementById("logError").textContent = ""
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs2) {
                    chrome.tabs.sendMessage(tabs2[0].id, {action: "getCached"}, (result) => {
                        console.log(result)
                        if (result.status.what == undefined || result.status.why == undefined) {
                            return
                        }
                        document.getElementById("what").value = result.status.what
                        document.getElementById("why").value = result.status.why
                        document.getElementById("result").value = result.status.result
                    })
                })
            } else {
                console.log("new case")
                document.getElementById("setup").style.display = "block";
                document.getElementById("active").style.display = "none";
                document.getElementById("operate").style.display = "none";
            }
        })
      });
    
    function submit(){
        var name = document.getElementById("name").value;
        var location = document.getElementById("location").value;
        var project = document.getElementById("project").value;

        var projectObject = {
            "name": name,
            "location": location,
            "project": project
        }
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "setStatus", projectObject: projectObject}, (result) => {
                console.log(result.status)
                if (result.status == "Success") {
                    document.getElementById("setup").style.display = "none";
                    document.getElementById("active").style.display = "block";
                    document.getElementById("operate").style.display = "block";
                    document.getElementById("active_case").textContent = projectObject.project
                    document.getElementById("active_researcher").textContent = projectObject.name
                    document.getElementById("active_location").textContent = projectObject.location
                    document.getElementById("logError").textContent = ""
                }
            })
        })
    }

    function submitCase() {
        var selected = document.getElementById("known_cases")
        var selected_case = selected.options[selected.selectedIndex].value;
        setCase(selected_case)
    }

    function newcase() {
        document.getElementById("setup").style.display = "block";
        document.getElementById("active").style.display = "none";
        document.getElementById("operate").style.display = "none";
    }

    async function log() {
        if (document.getElementById("setup").style.display == "block") {
            document.getElementById("logError").textContent = "Setup a case first!"
            return
        }
        var result = document.getElementById("result").value
        var imageB64 = "none"
        var project = document.getElementById("active_case").textContent
        var researcher = document.getElementById("active_researcher").textContent
        var location = document.getElementById("active_location").textContent
        var defaultline = document.getElementById("default").checked
        var what = document.getElementById("what").value;
        var why = document.getElementById("why").value;
        var screenshot = document.getElementById("screenshot").checked;
        var cocadd = document.getElementById("coc").checked;
        var url = await getUrl()
        console.log(url)
        if (screenshot) {
            var imageB64 = await screenshotPage()
            console.log(imageB64)
            var imageThumb = document.getElementById("actualImg")
            var downloadlink = document.createElement("a")
            downloadlink.href = imageB64
            downloadlink.download = `${project}_${researcher}_${new Date().toLocaleString().replace(",", "")}.png`
            document.getElementById("downloadImg").style.display = "block"
            document.getElementById("downloadImg").addEventListener("click", () => {
                downloadlink.click();
            })
            imageThumb.setAttribute("src", imageB64)
            imageThumb.style.display = "block"
        }
        if (defaultline) {
            what = `Gebrowsed naar ${url[0].url}`
        }
        var logObject = {
            "who": researcher,
            "where": location,
            "when": new Date().toLocaleString().replace(",", ""),
            "what": what,
            "why": why,
            "result": result,
            "url": url.url,
            "case": project,
            "screenshot": imageB64,
            "cocadd": cocadd
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "logLine", logObject: logObject}, (result) => {
                console.log(result)
            })
        
        })
        

    }

    function cache() {
        var what = document.getElementById("what").value;
        var why = document.getElementById("why").value;
        var result = document.getElementById("result").value;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "cache", what: what, why: why, result: result}, (result) => {
                console.log(result)
            })
        })
    }

    function clear() {
        var case_name = document.getElementById("active_case").textContent
        if (confirm("Are you sure you want to clear the log?")) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "clear", case_name: case_name}, (result) => {
                    console.log(result)
                })
            
            })
        }
    }

    function screenshotPage() {
        return new Promise((resolve, reject) => {
            chrome.tabs.captureVisibleTab(null, {}, resolve)
        })
    }

    function getUrl() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({active: true, currentWindow: true}, resolve)
        })
    }

    function setCase(case_name) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "setCase", case_name: case_name}, (result) => {
                document.getElementById("setup").style.display = "none";
                document.getElementById("active").style.display = "block";
                document.getElementById("operate").style.display = "block";
                document.getElementById("active_case").textContent = result.status.project
                document.getElementById("active_researcher").textContent = result.status.name
                document.getElementById("active_location").textContent = result.status.location
                document.getElementById("logError").textContent = ""
            })
        
        })
    }

    function download() {
        var case_name = document.getElementById("active_case").textContent
        var researcher = document.getElementById("active_researcher").textContent
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "download"}, (result) => {
                var rows = [
                    ["Wie", "Waar", "Wanneer", "Wat", "Waarom", "Hoe", "Resultaat", "Query", "URL", "Case"]
                ]
                console.log(result.status)
                for (line of result.status) {
                    if (line.case == case_name) {
                        console.log(line)
                        rows.push([
                            line.who,
                            line.where,
                            line.when,
                            line.what,
                            line.why,
                            line.how,
                            line.result,
                            line.query,
                            line.url,
                            line.case
                        ])
                    }
                    
                }
                let csvContent = "data:text/csv;charset=utf-8," 
                + rows.map(e => e.join("\t")).join("\n");
                var encodedUri = encodeURI(csvContent);
                // window.open(encodedUri);    
                var blob = new Blob([], {type: "text/csv"})
                // var url = URL.createObjectURL(blob)
                chrome.downloads.download({
                    url: encodedUri,
                    filename: `${case_name}_${researcher}.csv`
                })
            })
        })
        
    }

    function importCase() {
        chrome.tabs.create({url: chrome.extension.getURL('import.html')});
        window.location.reload()
    }

    function fileSelected(file) {
        console.log(document.getElementById("fileInput").value);
        var file = document.getElementById("fileInput").files[0];
        var reader = new FileReader();

        reader.onload = (progressEvent) => {
            console.log(this.result);
            var lines = this.result.split('\n');
            for(var line = 0; line < lines.length; line++){
                console.log(lines[line]);
              }
        }
        reader.readAsText(file);
    }

    function checkAutoLog() {
        chrome.storage.local.get(['auto'], (result) => {
            if (result.auto == undefined || result.auto == false) {
                document.getElementById("autolog").style.color = "red"
            } else {
                document.getElementById("autolog").style.color = "green"
            }
        })
    }

    function autoLog() {
        var who = document.getElementById("active_researcher").textContent
        var where = document.getElementById("active_location").textContent
        var project = document.getElementById("active_case").textContent
        chrome.storage.local.get(['auto'], (result) => {
            if (result.auto == undefined || result.auto == false) {
                chrome.storage.local.set({auto: true})
                chrome.storage.local.set({activeCase: {who: who, where: where, case: project}})
                document.getElementById("autolog").style.color = "green"
            } else {
                chrome.storage.local.set({auto: false})
                chrome.storage.local.set({activeCase: undefined})
                document.getElementById("autolog").style.color = "red"
            }
        })

    }

    


}, true)