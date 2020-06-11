chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({project: "fresh"})
    chrome.storage.local.set({cases: []})
    chrome.storage.local.set({lines: []})
    chrome.storage.local.set({cache: {what: "", why:"", result: ""}})
})

// chrome.runtime.onMessage.addListener(
//     async (request, sender, sendResponse) => {
//         console.log("got it")
//         if (request.action == "checkStatus") {
//             checkStatus().then((result) => {
//                 console.log(result)
//             })
//         }
//         if (request.action == "setStatus") {
//             setStatus(request.projectObject)
//         }
// })

// function checkStatus() {
//     return new Promise((resolve, reject) => {
//         chrome.sync.storage.get(['project'], (result) => {
//             resolve(result)
//         })
//     })
// }

// function setStatus(projectObject) {
//     chrome.storage.sync.set({project: projectObject})
// }