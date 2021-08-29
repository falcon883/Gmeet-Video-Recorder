function sendMsg(msg, data) {
    chrome.runtime.sendMessage({ info: msg, data: data })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function GetParticipants() {
    let participants = []
    let participantList = document.querySelector('div[aria-label="Participants"]')

    if (!participantList) {
        alert("To access participation list it needs to opened first. So, the program will open and close the panel. Please do not interfere it.")
        const pbtn = document.querySelectorAll('button[jsname="A5il2e"]')[1]
        pbtn.click()
        await sleep(500)
        pbtn.click()
        participantList = document.querySelector('div[aria-label="Participants"]')
    }
    for (const participant of participantList.childNodes) {
        let participantInfo = participant.childNodes[0]
        let displayPicUrl = participantInfo.childNodes[0].src,
            name = SanitizeName(participantInfo.childNodes[1].textContent)

        participants.push({ name: name, dpUrl: displayPicUrl, videoId: "" })
    }
    participants = GetParticipantsVideo(participants)
    // console.log(participants);
    sendMsg("participants", participants)
}

function GetParticipantsVideo(participants) {
    let videos = document.querySelectorAll('video')
    for (const video of videos) {
        let name = video.parentElement.parentElement.querySelector('div[data-self-name="You"]').textContent
        participants.forEach(p => {
            let _name = p.name.replace(' (Meeting host)', '').replace(' (Presentation)', '').replace(' (Your presentation)', ' You')
            // console.log(_name);
            // console.log(name);
            if (name.includes('You') && _name.includes('You')) {
                p.videoId = video.parentElement.getAttribute('data-ssrc')
                return
            }
            if (_name == name) {
                p.videoId = video.parentElement.getAttribute('data-ssrc')
            }
        });
    }
    return participants
}

function SanitizeName(name) {
    name = name.replace('Meeting host', ' (Meeting host)').replace('(You)', ' (You)')
        .replace('Presentation', ' (Presentation)').replace('Your presentation', ' (Your presentation)')
    return name.trim()
}

GetParticipants()