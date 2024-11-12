// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAoy1GrAdn9xhmSsxzrrmklvPoUZhaILUg",
    authDomain: "chatyouji-23.firebaseapp.com",
    projectId: "chatyouji-23",
    storageBucket: "chatyouji-23.firebasestorage.app",
    messagingSenderId: "566508950101",
    appId: "1:566508950101:web:2950e51213d0ad62643adc",
    measurementId: "G-TSZLJGMX8M"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupButton = document.getElementById("signupButton");
const loginButton = document.getElementById("loginButton");
const createAccountButton = document.getElementById("createAccountButton");
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const newEmailInput = document.getElementById("newEmail");
const newPasswordInput = document.getElementById("newPassword");
const friendNameInput = document.getElementById("friendName");
const searchButton = document.getElementById("searchButton");
const friendResultsDiv = document.getElementById("friendResults");
const sendButton = document.getElementById("sendButton");
const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const friendRequestsDiv = document.getElementById("friendRequests");
const loginPage = document.getElementById("loginPage");
const signupPage = document.getElementById("signupPage");
const searchPage = document.getElementById("searchPage");
const friendRequestsPage = document.getElementById("friendRequestsPage");
const chatPage = document.getElementById("chatPage");
const friendsListDiv = document.getElementById("friendsList");

// Show the login page initially
loginPage.classList.remove("hidden");

// Handle sign up process
signupButton.addEventListener("click", () => {
    loginPage.classList.add("hidden");
    signupPage.classList.remove("hidden");
});

createAccountButton.addEventListener("click", () => {
    const firstName = firstNameInput.value;
    const lastName = lastNameInput.value;
    const email = newEmailInput.value;
    const password = newPasswordInput.value;

    if (firstName === "" || lastName === "" || email === "" || password === "") {
        alert("Please fill in all fields!");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            database.ref("users/" + user.uid).set({
                firstName: firstName,
                lastName: lastName,
                email: email,
                online: true // Set the user as online when they create an account
            });
            alert("Account created successfully!");
            signupPage.classList.add("hidden");
            searchPage.classList.remove("hidden");
        })
        .catch(error => {
            alert(error.message);
        });
});

// Handle login process
loginButton.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (email === "" || password === "") {
        alert("Please fill in both fields!");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert("Logged in successfully!");
            // Update user online status to true
            const userId = auth.currentUser.uid;
            database.ref("users/" + userId).update({ online: true });

            loginPage.classList.add("hidden");
            searchPage.classList.remove("hidden");
        })
        .catch(error => {
            alert(error.message);
        });
});

// Search for a friend
searchButton.addEventListener("click", () => {
    const friendName = friendNameInput.value.toLowerCase();

    if (friendName === "") {
        alert("Please enter a friend's name!");
        return;
    }

    database.ref("users").orderByChild("firstName").equalTo(friendName).once("value")
        .then(snapshot => {
            if (snapshot.exists()) {
                friendResultsDiv.innerHTML = "";
                snapshot.forEach(childSnapshot => {
                    const friend = childSnapshot.val();
                    const friendDiv = document.createElement("div");
                    friendDiv.textContent = `${friend.firstName} ${friend.lastName}`;
                    const addFriendButton = document.createElement("button");
                    addFriendButton.textContent = "Send Friend Request";
                    addFriendButton.onclick = () => sendFriendRequest(childSnapshot.key);
                    friendDiv.appendChild(addFriendButton);
                    friendResultsDiv.appendChild(friendDiv);
                });
            } else {
                friendResultsDiv.innerHTML = "No friends found!";
            }
        });
});

// Send a friend request
function sendFriendRequest(friendId) {
    const userId = auth.currentUser.uid;
    const requestRef = database.ref("friendRequests").child(friendId).push();
    requestRef.set({
        fromUser: userId,
        status: "pending"
    });

    // Send the notification to the friend
    const userRef = database.ref("users").child(userId);
    userRef.once("value", (snapshot) => {
        const user = snapshot.val();
        const friendNotificationRef = database.ref("notifications").child(friendId).push();
        friendNotificationRef.set({
            message: `${user.firstName} ${user.lastName} sent you a friend request.`,
            type: "friendRequest",
            fromUser: userId,
            status: "unread"
        });
    });

    alert("Friend request sent!");
}

// Show friend requests
function showFriendRequests() {
    const userId = auth.currentUser.uid;
    const friendRequestsRef = database.ref("friendRequests").child(userId);

    friendRequestsRef.on("child_added", (snapshot) => {
        const requestData = snapshot.val();
        const requestId = snapshot.key;

        if (requestData.status === "pending") {
            const requestDiv = document.createElement("div");
            requestDiv.textContent = `Friend request from user ID: ${requestData.fromUser}`;

            const acceptButton = document.createElement("button");
            acceptButton.textContent = "Accept";
            acceptButton.onclick = () => acceptFriendRequest(requestId, userId);

            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";
            rejectButton.onclick = () => rejectFriendRequest(requestId);

            requestDiv.appendChild(acceptButton);
            requestDiv.appendChild(rejectButton);
            friendRequestsDiv.appendChild(requestDiv);
        }
    });
}

// Accept friend request and show chat page
function acceptFriendRequest(requestId, userId) {
    const requestRef = database.ref("friendRequests").child(userId).child(requestId);
    requestRef.update({ status: "accepted" })
        .then(() => {
            const fromUserId = requestRef.val().fromUser;
            addFriend(userId, fromUserId);
            alert("Friend request accepted!");
            showChatPage(fromUserId);  // Show chat page after accepting the friend request
        });
}

// Add friend to the friend list
function addFriend(userId, friendId) {
    const friendsRef = database.ref("friends").child(userId);
    friendsRef.push().set({
        friendId: friendId
    });

    const friendRef = database.ref("friends").child(friendId);
    friendRef.push().set({
        friendId: userId
    });

    showFriendsList(); // Show updated friend list after adding friend
}

// Show the chat page and load messages
function showChatPage(friendId) {
    // Hide other pages
    searchPage.classList.add("hidden");
    friendRequestsPage.classList.add("hidden");
    chatPage.classList.remove("hidden");

    // Load messages between the current user and their friend
    loadMessages(auth.currentUser.uid, friendId);
}

// Function to load messages between two users (chat)
function loadMessages(userId, friendId) {
    const chatRef = database.ref("chats").child(userId).child(friendId);
    
    chatRef.on("child_added", (snapshot) => {
        const messageData = snapshot.val();
        const messageDiv = document.createElement("div");
        messageDiv.textContent = `${messageData.sender}: ${messageData.text}`;
        messagesDiv.appendChild(messageDiv);
    });

    sendButton.onclick = () => sendMessage(userId, friendId);
}

// Function to send a message
function sendMessage(userId, friendId) {
    const messageText = messageInput.value;

    if (messageText.trim() === "") {
        alert("Please enter a message!");
        return;
    }

    const messageData = {
        sender: userId,
        text: messageText
    };

    // Save the message to both users' chat data
    const userChatRef = database.ref("chats").child(userId).child(friendId);
    userChatRef.push().set(messageData);

    const friendChatRef = database.ref("chats").child(friendId).child(userId);
    friendChatRef.push().set(messageData);

    // Clear the input field
    messageInput.value = "";
}

// Show friends list
function showFriendsList() {
    const userId = auth.currentUser.uid;
    const friendsRef = database.ref("friends").child(userId);

    friendsRef.once("value", (snapshot) => {
        friendsListDiv.innerHTML = ""; // Clear previous friends list
        snapshot.forEach(childSnapshot => {
            const friendId = childSnapshot.val().friendId;
            const friendDiv = document.createElement("div");
            friendDiv.textContent = `Friend ID: ${friendId}`;
            const chatButton = document.createElement("button");
            chatButton.textContent = "Start Chat";
            chatButton.onclick = () => showChatPage(friendId);
            friendDiv.appendChild(chatButton);
            friendsListDiv.appendChild(friendDiv);
        });
    });
}
