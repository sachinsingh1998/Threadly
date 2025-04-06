import { BACKEND_PORT } from './config.js';
import { getCurrentToken, getLoggedInUser } from './main.js';
import {toggleThreadCreate,DisplayIndvThread,getThreadDetail, showCreateThreadError} from './threadcreate.js';


export const DeleteIndThread = threadId =>{
    alert(`Deleting ${threadId}`);

    const token =  localStorage.getItem('token');

    fetch(`http://localhost:${BACKEND_PORT}/thread/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
        },
        body: JSON.stringify({id : threadId}),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        else{
            //Deleted thread
        }
        return response.json();
      })
      .catch(error => {
        console.error('Error deleting thread:', error);
      });

    //reloading list of threads
    toggleThreadCreate(false);
};



export function setUpThreadInteractionEventListeners(){
    //update listeners

    document.getElementById('ind-thread-edit').addEventListener('click', (event) => {
      event.preventDefault();
      const ThreadId = document.querySelector('.card-body.ind-thread-container').id; 
      getThreadDetail(ThreadId)
      .then(details => {
        //cant edit locked thread
        
        if(details.lock){          
          //showCreateThreadError('Cannot edit locked thread');
          showCreateThreadError('Cannot edit a locked thread');
          return;
        }
        //show modal
        let editModal = new bootstrap.Modal(document.getElementById('editModal'));
        editModal.show();

        document.getElementById('editModal').style.display = 'block';

        document.getElementById('update-thread-title').value = details.title;
        document.getElementById('update-thread-content').value = details.content;
        document.getElementById('update-thread-private').checked = !details.isPublic;
        document.getElementById('update-thread-locked').checked = details.lock;
      });
        
    });


    document.getElementById('update-thread-details').addEventListener('click' , function(){
        
      //getting the thread id
        const ThreadId = document.querySelector('.card-body.ind-thread-container').id; 
        const title = document.getElementById('update-thread-title').value;
        const isPublic = !(document.getElementById('update-thread-private').checked);
        const content = document.getElementById('update-thread-content').value;
        const locked = document.getElementById('update-thread-locked').checked;

        const token =  getCurrentToken();

        // Send thread update data

        const sendObject = {
          "id": ThreadId,
          "title": title,
          "isPublic": isPublic,
          "lock": locked,
          "content": content
        }
      
        fetch(`http://localhost:${BACKEND_PORT}/thread`, {
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
            DisplayIndvThread(ThreadId);

        }
    })
    .catch(error => {
        alert('An error occurred.  Please try again.')
    });

        //updateThread(ThreadDiv.id);
      } );
    //delete listener
    document.getElementById('ind-thread-delete').addEventListener('click', function(){
        const ThreadDiv = document.querySelector('.card-body.ind-thread-container'); 
        DeleteIndThread(ThreadDiv.id);
      });

    //liking
    document.getElementById('ind-thread-like').addEventListener('click', () => {


      const ThreadId = document.querySelector('.card-body.ind-thread-container').id;   
      
      const token =  getCurrentToken();

      getThreadDetail(ThreadId)
      .then(details => {
        //if locked thread
        if (details.lock){
          showCreateThreadError('Cant like locked thread');
          return;
        }

        const loggedInUserId =  getLoggedInUser();
        let turnon = true;
        //if logged in user has already liked
        for(let likedUser in details.likes){
            if(loggedInUserId === details.likes[likedUser]){
              turnon = false;
            }
        }
        

        const sendObject = {
          "id": ThreadId,
          "turnon" : turnon
        };
      
        fetch(`http://localhost:${BACKEND_PORT}/thread/like`, {
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
          DisplayIndvThread(ThreadId);
          
          //update likes count on the thread list screen
          const paragraph = document.getElementById('show-thread-list').querySelector(`p[thread-id='${ThreadId}']`);
          
          if (paragraph) {
            let current_like = details.likes.length;
            
            if(turnon){
              current_like +=1;
            }
            else{
              current_like-=1;
            }

            paragraph.textContent = `${paragraph.getAttribute('thread-author')} ${current_like}👍`;  
          }
          
  
        }
    })
    .catch(error => {
        alert(`An error occurred.  Please try again. ${error}`);
    });

      });
          

    });

    //watch thread
    document.getElementById('ind-thread-watch').addEventListener('click', () => {
      const ThreadId = document.querySelector('.card-body.ind-thread-container').id;   
    

      const token =  localStorage.getItem('token')

      getThreadDetail(ThreadId)
      .then(details => {
        //if locked thread
        if (details.lock){
          showCreateThreadError('Cant watch locked thread');
          return;
        }

        const loggedInUserId =  Number(localStorage.getItem('userId'));
        let turnon = true;
        //if logged in user is already watching
        for(let watchingUser in details.watchees){
            if(loggedInUserId === details.watchees[watchingUser]){
              turnon = false;
            }
        }
        

        const sendObject = {
          "id": ThreadId,
          "turnon" : turnon
        };
      
        fetch(`http://localhost:${BACKEND_PORT}/thread/watch`, {
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
          
          DisplayIndvThread(ThreadId);
          
        }
    })
    .catch(error => {
        alert('An error occurred.  Please try again.')
    });

      });
          
    });
};

