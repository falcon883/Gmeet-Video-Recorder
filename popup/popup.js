const participants = document.querySelector('.participants')
const noList = document.querySelector('.no-list')

const allowedUrls = [
    'https://meet.google.com/',
];

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const i = allowedUrls.findIndex(u => tab.url.includes(u)) + 1;

    if (i == 0) {
        disableScreen()
    }
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.info == 'participants') {
            if (request.data) {
                noList.classList.add('hide')
                participants.innerHTML = ''
                participants.classList.remove('hide')
                request.data.forEach(e => {
                    let videoId = null
                    if (e != undefined) {
                        videoId = e.videoId
                    }
                    AddCard(participants, e.name, e.dpUrl, videoId)
                });
            }
        }
    }
);

function disableScreen() {
    var div = document.createElement('div');
    div.className += 'overlay';
    document.body.appendChild(div);
}

function AddCard(parent, name, dp, videoId) {
    const elemP = document.createElement('div')
    elemP.className = 'participant'

    const elemName = document.createElement('span')
    elemName.className = 'name'
    elemName.textContent = name

    const elemDP = document.createElement('img')
    elemDP.className = 'display-pic'
    elemDP.src = dp

    const recBtn = document.createElement('div')
    recBtn.className = 'rec-btn'
    recBtn.setAttribute('data-toggled', 'false')
    recBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
    <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>`

    if (videoId != null) {
        addRecordListener(recBtn, videoId)
    } else {
        recBtn.classList.add('disabled')
    }

    elemP.appendChild(elemDP)
    elemP.appendChild(elemName)
    elemP.appendChild(recBtn)

    parent.appendChild(elemP)
}

document.getElementById('getp').addEventListener("click", async () => {
    chrome.runtime.sendMessage({
        task: 'get_participants'
    }, function (response) {
        console.log(response.resp);
    });
});

function addRecordListener(elem, videoId) {
    elem.addEventListener('click', () => {
        let toggled = (elem.getAttribute('data-toggled') === 'true')
        elem.setAttribute('data-toggled', !toggled)

        if (!toggled) {
            chrome.runtime.sendMessage({
                task: 'start_recording',
                videoId: videoId
            }, function (response) {
                console.log(response.resp);
                if (!response.isRecording) {
                    elem.setAttribute('data-toggled', false)
                }
            });
        } else {
            chrome.runtime.sendMessage({
                task: 'stop_recording',
                videoId: videoId
            }, function (response) {
                console.log(response.resp);
                elem.setAttribute('data-toggled', false)
            });
        }
    })
}
