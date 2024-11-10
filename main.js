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

// Elements from HTML
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupButton = document.getElementById("signupButton");
const loginButton = document.getElementById("loginButton");
const statusMessage = document.getElementById("statusMessage");
const chatContainer = document.getElementById("chatContainer");
const searchContainer = document.getElementById("searchContainer");
const searchFriendInput = document.getElementById("searchFriend");
const searchButton = document.getElementById("searchButton");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messagesDiv = document.getElementById("messages");

// Create a new account
signupButton.addEventListener("click", () => {
    const firstName = firstNameInput.value;
    const lastName = lastNameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    if (firstName === "" || lastName === "" || email === "" || password === "") {
        statusMessage.textContent = "Please fill in all fields.";
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            // Store user's name in Firebase Realtime Database
            const user = auth.currentUser;
            database.ref('users/' + user.uid).set({
                firstName: firstName,
                lastName: lastName,
                email: email
            });
            statusMessage.textContent = "Account created successfully!";
            chatContainer.classList.remove("hidden");
            searchContainer.classList.remove("hidden");
        })
        .catch((error) => {
            statusMessage.textContent = "Error: " + error.message;
        });
});

// Log in an existing user
loginButton.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (email === "" || password === "") {
        statusMessage.textContent = "Please fill in both fields.";
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            statusMessage.textContent = "Logged in successfully!";
            chatContainer.classList.remove("hidden");
            searchContainer.classList.remove("hidden");
            loadMessages();
        })
        .catch((error) => {
            statusMessage.textContent = "Error: " + error.message;
        });
});

// Search for a friend
searchButton.addEventListener("click", () => {
    const searchQuery = searchFriendInput.value;
    if (searchQuery !== "") {
        database.ref('users').orderByChild('firstName').equalTo(searchQuery).once("value", snapshot => {
            if (snapshot.exists()) {
                // Display search results (just an example)
                let users = snapshot.val();
                messagesDiv.innerHTML = '';
                for (let uid in users) {
                    let user = users[uid];
                    let userElement = document.createElement("p");
                    userElement.textContent = `${user.firstName} ${user.lastName}`;
                    messagesDiv.appendChild(userElement);
                }
            } else {
                statusMessage.textContent = "No users found.";
            }
        });
    }
});

// Send a message
sendButton.addEventListener("click", () => {
    const message = messageInput.value;
    if (message.trim() !== "") {
        const messagesRef = database.ref("messages").push();
        messagesRef.set({
            user: auth.currentUser.email,
            message: message,
            timestamp: Date.now()
        });
        messageInput.value = ""; // Clear the input
    }
});

// Load messages
function loadMessages() {
    database.ref("messages").on("child_added", (snapshot) => {
        const messageData = snapshot.val();
        const messageElement = document.createElement("p");
        messageElement.textContent = `${messageData.user}: ${messageData.message}`;
        messagesDiv.appendChild(messageElement);
    });
}
