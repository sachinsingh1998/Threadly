import { getThreadComments } from './Comments.js';
import { BACKEND_PORT } from './config.js';
import { closeThreadError, getThreadDetail, getThreads, getUserDetails, showCreateThreadError, showLoggedinPages } from './threadcreate.js';
import { getCurrentToken, getCurrentUserIsAdmin, getLoggedInUser } from './main.js';
import { fileToDataUrl } from './helpers.js';


//show user's profile on screen
export const showUserProfile = (userId) => {
    
    document.getElementById('update-admin-status').style.display='none';
    
    toggleUserProfile(true);
    getUserDetails(userId)
    .then( userDetails => {
        document.getElementById('user-profile-name').textContent = userDetails.name;
        document.getElementById('user-profile-email').textContent = userDetails.email;
        document.getElementById('user-profile-admin').textContent = userDetails.admin;
        document.getElementById('user-profile-image').src = userDetails.image;

        document.getElementById('ind-user-profile').setAttribute('current-user-id', userId);

        
        //display property to edit user access privilege
        if(getCurrentUserIsAdmin()){
            document.getElementById('update-admin-status').style.display='block';
            const adminStatus = document.getElementById('admin-status');
            //setting the current state
            if(userDetails.admin){
                adminStatus.value = "admin";
            }
            else{
                adminStatus.value = "user";
            }
        }

        //getThreadDetails
        RemovePreviousThreads();
        fetchThreads(userId);
        });
};

const RemovePreviousThreads = () =>{
    const ThreadDiv = document.querySelector('#user-show-threads');
    while (ThreadDiv.firstChild) {
      ThreadDiv.removeChild(ThreadDiv.firstChild); // Removes each child element one by one
    }
  };
  

//iteratively fetch threads
function fetchThreads(userId, i = 0) {
    
    getThreads(i)
        .then(threads => {
            if (threads.length === 0) {
                return; // Exit if no more threads
            }

            let threadPromises = threads.map(thread =>
                getThreadDetail(thread)
                    .then(threadDetail => {
                        if (Number(userId) === Number(threadDetail.creatorId)) {
                            showUserThreads(threadDetail);
                        }
                    })
            );

            // Wait for all threads in this batch to be processed
            Promise.all(threadPromises)
                .then(() => {
                    // Continue fetching next batch of threads
                    fetchThreads(userId, i + 5);
                });
        });
};

//create thread card for each thread
const showUserThreads = (thread) => {
    const ParentDiv = document.getElementById('user-show-threads');

    let element = document.createElement('li');
    getThreadComments(thread.id)
    .then(comments => {
        //creating card for indv comments
        const card = document.createElement('div');
        card.className = 'card';    

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        //card.appendChild(cardBody);

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.textContent = thread.title;
        cardBody.appendChild(cardTitle);

        const cardText = document.createElement('p');
        cardText.className = 'card-text';
        cardText.textContent = thread.content;
        cardBody.appendChild(cardText);
        
        //displaying likes and comment count
        const cardStats = document.createElement('p');
        cardStats.className = 'card-text';
        cardStats.textContent = `${thread.likes.length}💓         ${comments.length}🗨️`;
        cardBody.appendChild(cardStats);
        
        card.appendChild(cardBody);

        ParentDiv.appendChild(card);
        
    });
};

//toggle between view user profile and normal screen
const toggleUserProfile = (showUser) => {
    if(showUser){
        showLoggedinPages('indUserProfile');
    }
    else{
        showLoggedinPages('normal');
    }
};

//toggle between user edit page
const toggleUserEdit = (userEdit) => {
    if(userEdit){
        showLoggedinPages('editUserPage');
    }
    else{
        showLoggedinPages('normal');
    }
};


export const UserListeners = () =>{
    document.getElementById('unshow-user-profile').addEventListener('click', () => {
        toggleUserProfile(false);
    });

    document.getElementById('ind-thread-author').addEventListener('click', (event) => {
        let authorId = event.target.getAttribute('authorId');
        showUserProfile(Number(authorId));
    });
    
    document.getElementById('view-user-profile').addEventListener('click', () => {
        
        const loggedinId = getLoggedInUser();
        showUserProfile(loggedinId);

    });

    document.getElementById('edit-user-profile').addEventListener('click', () => {
        toggleUserEdit(true);
    });
    
    document.getElementById('goto-user-profile').addEventListener('click', () => {
        toggleUserEdit(false);
    });

    //changing admin status
    document.getElementById('update-admin-status-submit').addEventListener('click', () => {
        const access = document.getElementById('admin-status').value;
        let turnon = false;
        if (access === 'admin'){
            turnon = true;
        }      
        
        const userId = document.getElementById('ind-user-profile').getAttribute('current-user-id');
        //seding data
        const sendObject = {        
            "userId":userId,
            "turnon":turnon
        }

        //getting current token
        const token = getCurrentToken();

        fetch(`http://localhost:${BACKEND_PORT}/user/admin`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendObject),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log(data.error)
            } else {
                alert('updated');
                toggleUserProfile(false);
            }
        })
        .catch(error => {
            alert('An error occurred.  Please try again.')
        });
    });

    document.getElementById('update-user-profile').addEventListener('click', () => {
        
        //inputting values
        const email = document.getElementById('update-email').value;
        const name = document.getElementById('update-name').value;
        const password = document.getElementById('update-password').value;
        const image = document.getElementById('update-image').files[0];
        
        //if image is updated
        if(image){
            fileToDataUrl(image)
            .then(imageId => {
                
                //fetch
                // Send thread update data
                const sendObject = {
    
                    "email":email,
                    "password" : password,
                    "name":name,
                    "image":imageId
                }
                
                //getting current token
                const token = getCurrentToken();

                fetch(`http://localhost:${BACKEND_PORT}/user`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sendObject),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showCreateThreadError('Updated email id is same as previous');
                    } else {
                        toggleUserEdit(false);
                    }
                })
                .catch(error => {
                    alert('An error occurred.  Please try again.')
                });
                //fetch
            });
        }
        //if image not updated
        else{

            //check if updating empty values
            if(email.trim().length === 0 && password.trim().length === 0 && name.trim().length === 0){
                showCreateThreadError('Updating empty value');
                return;
            }
            const sendObject = {
                    
                "email":email,
                "password" : password,
                "name":name,
            }
            //getting current token
            const token = getCurrentToken();

            fetch(`http://localhost:${BACKEND_PORT}/user`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sendObject),
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showCreateThreadError('Updated email id is same as previous');
                } else {
                    console.log('hogaya bc');
                    toggleUserEdit(false);
                }
            })
            .catch(error => {
                alert('An error occurred.  Please try again.')
            });

        }

    });
};

