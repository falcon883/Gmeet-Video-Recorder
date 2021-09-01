async function start(videoId) {
    function setRecorder(videoId, recorder) {
        try {
            if (GlobalRecorder == undefined || GlobalRecorder === null) {
                GlobalRecorder = new Object()
            }
        } catch (e) {
            if (e instanceof ReferenceError) {
                GlobalRecorder = new Object()
            }
        }
        GlobalRecorder[videoId] = recorder
    }

    let videos = document.querySelector(`div[data-ssrc="${videoId}"]`)
    let video

    if (videos === null) {
        return false
    }
    videos = videos.childNodes
    if (videos.length == 0) {
        return false
    }
    if (videos.length == 2) {
        if (videos[0] == undefined && videos[1] == undefined) {
            return false
        }
        video = videos[0] != undefined ? videos[0].srcObject : videos[1].srcObject
    } else {
        video = videos[0].srcObject
    }
    const recorder = new RecordRTCPromisesHandler(video, {
        type: 'video',
        mimeType: 'video/webm;codecs=vp8,opus'
    })

    recorder.startRecording()
    setRecorder(videoId, recorder)

    chrome.storage.local.get('recordingIds', function (result) {
        if (result.recordingIds == undefined) {
            chrome.storage.local.set({ recordingIds: [videoId] }, () => { });
        } else {
            if (typeof result.recordingIds != 'object') {
                chrome.storage.local.remove(['recordingIds'], function () {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        console.error(error);
                        return
                    }
                    chrome.storage.local.set({ recordingIds: [videoId] }, () => { });
                })
            } else {
                const ids = result.recordingIds
                console.log(ids);
                ids.push(videoId)
                chrome.storage.local.set({ recordingIds: ids }, () => { });
            }
        }
    });

    return true
}

async function stop(videoId) {
    function getRecorder(videoId) {
        if (GlobalRecorder != undefined || GlobalRecorder !== null) {
            return GlobalRecorder[videoId]
        }
        return null
    }

    const recorder = getRecorder(videoId)
    if (recorder !== null) {
        await recorder.stopRecording()
        getSeekableBlob(await recorder.getBlob(), function (seekableBlob) {
            invokeSaveAsDialog(seekableBlob);
        })
        chrome.storage.local.get(['recordingIds'], function (result) {
            const ids = result.recordingIds
            var index = ids.indexOf(videoId);
            if (index >= 0) {
                ids.splice(index, 1);
            }
            chrome.storage.local.set({ recordingIds: ids });
        });
        return true
    } else {
        sendResponse({
            resp: `Video Not On for ${request.videoId}`,
            isRecording: false
        });
    }
    return false
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.task) {
        case 'get_participants':
            chrome.windows.getCurrent(w => {
                chrome.tabs.query({ active: true, windowId: w.id }, tabs => {
                    const currTab = tabs[0];
                    if (currTab) {
                        chrome.scripting.executeScript({
                            target: { tabId: currTab.id },
                            files: ['content-script.js']
                        });
                    }
                });
            });

            sendResponse({ resp: 'Sending Participants' });
            break;
        case 'start_recording':
            chrome.windows.getCurrent(w => {
                chrome.tabs.query({ active: true, windowId: w.id }, tabs => {
                    const currTab = tabs[0];
                    if (currTab) {
                        chrome.storage.local.remove('recordingIds')
                        chrome.scripting.executeScript({
                            target: { tabId: currTab.id },
                            func: start,
                            args: [request.videoId]
                        }, async (res) => {
                            if (!res) {
                                sendResponse({
                                    resp: `Video Not On for ${request.videoId}`,
                                    isRecording: false
                                });
                            } else {
                                sendResponse({
                                    resp: `Video Recording On for ${request.videoId}`,
                                    isRecording: true
                                });
                            }
                        });
                    }
                });
            });
            break;
        case 'stop_recording':
            chrome.windows.getCurrent(w => {
                chrome.tabs.query({ active: true, windowId: w.id }, tabs => {
                    const currTab = tabs[0];
                    if (currTab) {
                        chrome.scripting.executeScript({
                            target: { tabId: currTab.id },
                            func: stop,
                            args: [request.videoId]
                        }, async (res) => {
                            if (res) {
                                sendResponse({
                                    resp: `Video stopped for ${request.videoId}`,
                                    isRecording: false
                                });
                            } else {

                            }
                        });
                    }
                });
            });
            break;
        default:
            break;
    }
    return true
});