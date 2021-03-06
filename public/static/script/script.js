const socket = io();
let typing = false;
let timeout = undefined;
const dropUpElement = document.getElementsByClassName("dropdown-menu")[0]
const messageContainer = document.getElementById("messages");
const sendButton = document.getElementById("sendButton")
const inputMessage = document.getElementById("inputMessage")

var modalRoom = document.getElementById("initialtChatModalRoom");
var modalContentRoom = document.getElementById("enterRoomModal");

var inputPassword = document.getElementById("inputRoomPass");
var roomNameDisplay = document.getElementById("roomNameDisplay");

function initSite(){
    displayModal();
    buttonStatus();
}

function sendChat(event) {
    event.preventDefault(); // prevents page reloading
    socket.emit('chat message', inputMessage.value);
    inputMessage.value = "";
    stillTyping();
};

inputMessage.addEventListener("input", function() {
    buttonStatus();
    shortCommmand();
    stillTyping();
})

function timeoutFunction(){
    typing = false;
    socket.emit("typing", typing);
}

function stillTyping() {
    let stillTyping = inputMessage.value.length;

    if(typing == false) {
        typing = true
        socket.emit("typing", typing);
        if (!stillTyping) {
            timeout = setTimeout(timeoutFunction, 1000);
        }
    } else {
        if (!stillTyping) {
            clearTimeout(timeout);
            timeout = setTimeout(timeoutFunction, 1000);
        }
    }
}

function shortCommmand() {
    if (/^[/]/.test(inputMessage.value) && inputMessage.value.length === 1) {
        dropUpElement.className = "dropdown-menu dropup show"
    } else {
        dropUpElement.classList.remove("show")
    }
}

function clearInputField() {
    dropUpElement.classList.remove("show")
    document.getElementById("inputMessage").value = ""
    stillTyping();
}

function scrollBottom() {
    var log = $('.messageContainer');
    log.scrollTop(log.prop("scrollHeight"));
}

function buttonStatus() {
    if (inputMessage.value.length) {
        sendButton.className = "btn btn-primary"
        sendButton.disabled = false;
    } else {
        sendButton.className = "btn btn-primary disabled"
        sendButton.disabled = true;
    }
}

function getGIF() {
    axios.get('/gif')
    .then(function (response) {
        socket.emit('gif', response.data);
    })
    .catch(function (error) {
        console.log(error);
    });

    clearInputField();
}

function getJoke() {
    axios.get('/joke')
    .then(function (response) {
        socket.emit('joke', response.data);
    })
    .catch(function (error) {
        console.log(error);
    });
    clearInputField();
}

function leaveRoom() {
    axios.get('/leaveRoom')
    .then(function (response) {
        socket.emit('leave', response.data.message);
    })
    .catch(function (error) {
        console.log(error);
    });
}

function noModal(){
    modalRoom.style.display = "none";
    modalContentRoom.style.display = "none";
}

window.addEventListener('DOMContentLoaded', function () {
    modalRoom.addEventListener("click", noModal, true);
});

function enterAndPass(event){
    event.preventDefault();
    let password = inputPassword.value

    axios.post('/roomAuth', {
        roomName: roomName,
        password: password,
    })
    .then(function (response) {
        if(response.status == 200){
            socket.emit('clickedRoom', roomName);
            noModal();
            displayActiveRoom(roomName); 
            inputMessage.focus(); 
        }
    })
    .catch(function (error) {
        alert(error.response.data.message);
    });

    messageContainer.innerHTML = "";
 
}

var modal = document.getElementById("initialtChatModal");
var modalContent = document.getElementById("modalContent");

function displayModal() {
    modal.style.display = "block";
    modalContent.style.display = "block";
}

function saveNickname(event){
    event.preventDefault();
    let inputNickName = document.getElementById("chatUser").value;
    let inputRoomName = document.getElementById("chatRoomName").value;
    let inputRoomPass = document.getElementById("chatRoomPass").value;

    if(inputNickName.length <= 2) {
        alert("Alias måste innehålla minst 3 karaktärer");
        return
    }

    socket.emit('userNickName', inputNickName);

    axios.post('/addNick', {
        name: inputNickName,
        room: inputRoomName,
        pass: inputRoomPass
    })
    .then(function (response) {
        if(response.status == 200){
            alert(response.data);
            modal.style.display = "none";
            modalContent.style.display = "none";
            inputMessage.focus(); 

            socket.emit('create', inputRoomName, inputRoomPass);

            alert("OBS! Joina ett rum för att börja chatta");
        }
    })
    .catch(function (error) {
        alert(error.response.data.message);
    });

   
}

let roomName;

socket.on('create', function(chatRooms){
    if(chatRooms.length) {
        const roomContainer = document.getElementById("allRooms");
        roomContainer.innerHTML = "";
    }
    for (var i = 0; i < chatRooms.length; i++){
        const roomContainer = document.getElementById("allRooms");
        const linkElement = document.createElement("li");
        linkElement.className = chatRooms[i].room
        linkElement.setAttribute("onclick","roomClicked(event)");

        linkElement.innerHTML = "✅ " + chatRooms[i].room + "<br><br>";
        roomContainer.appendChild(linkElement);
    }
});

function roomClicked(event) {
    roomName = event.target.className;
    
    modalRoom.style.display = "block";
    modalContentRoom.style.display = "block";
    inputPassword.focus();
    inputPassword.className = "form-control " + roomName;
    roomNameDisplay.innerHTML = "Joina " + roomName + " med rätt lösenord";

}

function displayActiveRoom(roomName){
    activeRoom = document.getElementById("activeRoom");
    activeRoom.style.background = "#000";
    activeRoom.style.padding = "0.5em";
    activeRoom.style.color = "#fff";
    activeRoom.style.borderRadius = "0.7em";
    if(activeRoom.value){
        activeRoom.innerHTML = ""
    }
    activeRoom.innerHTML = "Rum: " + roomName + "  👀";
}

socket.on('chat message', function(msg, nickname){
    let inputNickName = document.getElementById("chatUser").value;
   
    if (nickname == inputNickName) {
        const linkElement = document.createElement("li");
        const pElement = document.createElement("p");
        linkElement.className = "rightMsg";

        pElement.innerHTML = nickname;
        linkElement.innerHTML = " " + msg;
        messageContainer.appendChild(pElement);
        messageContainer.appendChild(linkElement);
        scrollBottom();
        buttonStatus();
    } else {
        const linkElement = document.createElement("li");
        const pElement = document.createElement("p");
        linkElement.className = "leftMsg";

        pElement.innerHTML = nickname;
        linkElement.innerHTML = " " + msg;
        messageContainer.appendChild(pElement);
        messageContainer.appendChild(linkElement);
        scrollBottom();
        buttonStatus();
    }

  

});


socket.on('connected user', function(nickname) {
    const messageContainer = document.getElementById("messages");
    const linkElement = document.createElement("li");

    linkElement.innerHTML = nickname + " har anslutit till rummet.";
    messageContainer.appendChild(linkElement);

    scrollBottom();
});
socket.on('disconnected user', function(nickname) {
    const linkElement = document.createElement("li")
    const typingContainer = document.getElementById("typing");

    linkElement.innerHTML = nickname + " har lämnat rummet."
    messageContainer.appendChild(linkElement)
    typingContainer.innerHTML = "";
    scrollBottom();
});


socket.on('typing user', function(typing, nickname){
    const typingContainer = document.getElementById("typing");
    if (typing) {
        typingContainer.innerHTML = nickname + " skriver...";
    } else {
        typingContainer.innerHTML = "";
    }
});

socket.on('send joke', function(joke, nickname){
    const linkElement = document.createElement("li");
    const pElement = document.createElement("p");
    linkElement.className = "rightMsg";

    pElement.innerHTML = nickname
    linkElement.innerHTML = joke
    messageContainer.appendChild(pElement)
    messageContainer.appendChild(linkElement)
    buttonStatus();
    scrollBottom();
})
   
socket.on('gif', function(gif, nickname){
    const imgElement = document.createElement("img");
    const pElement = document.createElement("p")
    pElement.innerHTML = nickname
    imgElement.src = gif;
    imgElement.style.height = "10em"
    messageContainer.appendChild(pElement)
    messageContainer.appendChild(imgElement)
    buttonStatus();
    scrollBottom();
});

socket.on('leaveRoom', function(message, nickname){
    let storeNickName = nickname
    let inputNickName = document.getElementById("chatUser").value;
    if (storeNickName === inputNickName) {
        alert(message);
        clearInputField();
        messageContainer.innerHTML = "";
        buttonStatus();
    }

});




