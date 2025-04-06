import { BACKEND_PORT } from './config.js';
import {setupThreadEventListener,toggleThreadCreate } from './threadcreate.js';
import {setUpThreadInteractionEventListeners} from './threadInteract.js';
import {getUserDetails} from './threadcreate.js';
import { UserListeners } from './User.js';

setupThreadEventListener();
setUpThreadInteractionEventListeners();
UserListeners();

//helper method to get token
export const getCurrentToken = () => {
    return localStorage.getItem('token');
};

//toggle between login and logout page
function setLoggedIn(loggedIn){
    if (loggedIn){
        document.getElementById('logged-out-page').style.display = 'none';
        document.getElementById('logged-in-page').style.display = 'block';
        toggleThreadCreate(false);
        
        getUserDetails(localStorage.getItem('userId'))
        .then(userDetails => {
            localStorage.setItem('admin',userDetails.admin);
        });
        
    }
    else{
        document.getElementById('logged-out-page').style.display = 'block';
        document.getElementById('logged-in-page').style.display = 'none';
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        
    }    
}

const token = localStorage.getItem('token');
if (token){
    setLoggedIn(true);
}



document.getElementById('logout').addEventListener('click', ()=>{
    setLoggedIn(false);
});


document.getElementById('goto-register-btn').addEventListener('click', ()=>{
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    clearLoggedOutError();

});

function setLoggedOutError(msg){
    document.getElementById('loggedout-error-popup').style.display = 'block';
    document.getElementById('loggedout-error-message').textContent = msg;

}

function clearLoggedOutError(){
    document.getElementById('loggedout-error-popup').style.display = 'none';
}

document.getElementById('loggedout-close-popup').addEventListener('click' , clearLoggedOutError);

document.getElementById('login-btn').addEventListener('click',()=>{
    //getting data
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
      // Send login request
      fetch(`http://localhost:${BACKEND_PORT}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            setLoggedOutError('Invalid credentials');
        } else {
            alert('Login successful!');
            localStorage.setItem('token',data.token);
            localStorage.setItem('userId',data.userId);
            setLoggedIn(true);
            
        }
    })
    .catch(error => {
        alert(`An error occurred during Login. Please try again. `);
    });
    
});

document.getElementById('register-btn').addEventListener('click', ()=>{
    
    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    //checking for empty value
    if(email.trim().length === 0 || name.trim().length === 0 || password.trim().length === 0){
        setLoggedOutError("Empty value not permitted");
        return;
    }
    
    //password and confirm password match
    if (password !== confirmPassword){
        setLoggedOutError("Passwords do not match");
        return;
    }

    // Send registration data to backend
    fetch(`http://localhost:${BACKEND_PORT}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, name, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            
            setLoggedOutError("Registration error");
        } else {

            localStorage.setItem('token',data.token);
            localStorage.setItem('userId',data.userId);
            setLoggedIn(true)

        }
    })
    .catch(error => {
        alert('An error occurred during registration. Please try again.')
    });
    
});

document.getElementById('register-cancel').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    clearLoggedOutError();

});

//method to get current logged in user id
export const getLoggedInUser = () => {
    return Number(localStorage.getItem('userId'));
};



export const getCurrentUserIsAdmin = () => {
    return JSON.parse(localStorage.getItem('admin'));
};

