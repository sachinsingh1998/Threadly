import { BACKEND_PORT } from './config.js';
import {CommentListeners, getThreadCommentsDom} from './Comments.js';
import { getCurrentToken, getLoggedInUser } from './main.js';

CommentListeners();

export const getThreads = index => {
    
    const token =  localStorage.getItem('token');
    return fetch(`http://localhost:${BACKEND_PORT}/threads/?start=${index}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(threads => {
        return threads;
      })
      .catch(error => {
        console.error('Error fetching threads:', error);
      });
    
};

//index of the next thread
let nextThread = 0;

export const getThreadDetail = threadId => {
    const token =  localStorage.getItem('token');

    return fetch(`http://localhost:${BACKEND_PORT}/thread/?id=${threadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, 
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(threadInfo => {
        
        return threadInfo;
      })
      .catch(error => {
        console.error('Error fetching threads:', error);
      });

};

//method for displaying individual thread
export const DisplayIndvThread = threadid => {
  const modalDiv = document.getElementById('editModal');
  modalDiv.setAttribute('aria-hidden', 'true');
  getThreadDetail(threadid)
  .then( details => {
    //setting id
    const ThreadDiv = document.querySelector('.card-body.ind-thread-container'); 
    ThreadDiv.id = threadid;

    //setting attributes
    document.getElementById('ind-thread-title').innerText = details.title;
    document.getElementById('ind-thread-details').innerText = details.content;
    document.getElementById('ind-thread-like').innerText = details.likes.length;
    
    //initially unliked
    document.getElementById('ind-thread-like').className = "far fa-thumbs-up";
    const loggedInUserId =  getLoggedInUser();
    
    //check if the logged in user has already liked the thread
    for (let i in details.likes){
      if(details.likes[i] === loggedInUserId){
        document.getElementById('ind-thread-like').className = "fas fa-thumbs-up";
      }
    }
    document.getElementById('ind-thread-watch').className = "fa fa-eye-slash";
    //similarly check for thread watch
    for (let i in details.watchees){
      if(details.watchees[i] === loggedInUserId){
        document.getElementById('ind-thread-watch').className = "fa fa-eye";
      }

    }

    document.getElementById('ind-thread-hidden-buttons').style.display = 'none';
    
    //setting author id
    getUserDetails(details.creatorId)
    .then(author => {
      document.getElementById('ind-thread-author').innerText = author.name;
      document.getElementById('ind-thread-author').setAttribute('authorId', author.id);
      document.getElementById('ind-thread-user-image').src = author.image;
    });
    
    //checking if the user is admin
    getUserDetails(loggedInUserId)
    .then (userDetails => {
      if (userDetails.admin || loggedInUserId === details.creatorId)
        document.getElementById('ind-thread-hidden-buttons').style.display = 'block';
      
    });

    //displaying individual comments for thread
    getThreadCommentsDom(threadid)
    .then(ul => {
      RemovePreviousComment();
      let commentsDiv = document.querySelector('.ind-thread-comments');
      commentsDiv.appendChild(ul);
    });

  });
};


export const getUserDetails = userId => {
    
    const token =  getCurrentToken();

    return fetch(`http://localhost:${BACKEND_PORT}/user/?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, 
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(userInfo => {
        return userInfo;
      })
      .catch(error => {
        console.error('Error fetching threads:', error);
      });
}

const RemovePreviousComment = () =>{
  const commenttDiv = document.querySelector('.ind-thread-comments');
  while (commenttDiv.firstChild) {
    commenttDiv.removeChild(commenttDiv.firstChild); // Removes each child element one by one
  }
};

const RemovePreviousThread = () =>{
  const threadListDiv = document.querySelector('#show-thread-list');
  while (threadListDiv.firstChild) {
    threadListDiv.removeChild(threadListDiv.firstChild); // Removes each child element one by one
  }
};

const showThread = listofthreads => {

  //iff sufficient thread present, show load more button/
  if(listofthreads.length === 5){
    document.getElementById('thread-loadmore').style.display = 'block';
  }  
  else{
    document.getElementById('thread-loadmore').style.display = 'none';  
  } 
  
  //no more threads
    if(listofthreads.length === 0){
      return;
    }

    //Remove previously loaded list of threads first
    RemovePreviousThread();
    for (let threadIds in listofthreads){
        getThreadDetail(listofthreads[threadIds])
        .then(details => {
            getUserDetails(details.creatorId)
            .then(userDetails => {
                const ThreadDetailsObject = {
                    id:details.id,
                    title:details.title,
                    postDate: new Date(details.createdAt).toISOString().split('T')[0],
                    author:userDetails.name,
                    likes_count: details.likes.length
                };
                displayThread(ThreadDetailsObject);
                
            });
            
        })
    }
    
};

//method to display each ind thread on index.hrtml page
const displayThread = (ThreadObject) => {
    
    const threadListDiv = document.querySelector('#show-thread-list');
    const anchor = document.createElement('a');
    //anchor.id = ThreadObject.id;
    anchor.href = '#';
    anchor.classList.add('list-group-item', 'list-group-item-action','show-thread');
    anchor.setAttribute('aria-current', 'true');
    anchor.setAttribute('thread-id',ThreadObject.id);
    
    
    anchor.addEventListener('click', function() {
      DisplayIndvThread(ThreadObject.id);
    });
    
    const flexDiv = document.createElement('div');
    flexDiv.classList.add('d-flex', 'w-100', 'justify-content-between','show-thread');

    const title = document.createElement('h5');
    title.classList.add('mb-1','show-thread');
    title.textContent = ThreadObject.title;

    const postDate = document.createElement('small');
    postDate.textContent = ThreadObject.postDate;

    flexDiv.appendChild(title);
    flexDiv.appendChild(postDate);

    const paragraph = document.createElement('p');
    paragraph.classList.add('mb-1');
    paragraph.textContent = `${ThreadObject.author} ${ThreadObject.likes_count}👍`;
    paragraph.setAttribute('thread-id',ThreadObject.id);
    paragraph.setAttribute('thread-author',ThreadObject.author);

    anchor.appendChild(flexDiv);
    anchor.appendChild(paragraph);

    threadListDiv.appendChild(anchor);
}

export const toggleThreadCreate = create =>{

    if (create){
      //emptying previous error messages
      closeThreadError();
      showLoggedinPages('createThread');
    }
    else{
        showLoggedinPages('normal');
      
        nextThread = 0;
        getThreads(nextThread)
        .then(listofthreads => {
            showThread(listofthreads);
        })
        .catch(error => {
            console.error("Failed to fetch threads: ", error);
        });
    }  
};

//method to toggle amongst Loggedin Pages
export const showLoggedinPages = (targetPage) => {
  
  //map page to ids
  const pageMapping = {
    
    normal:"logged-in-content-normal",
    createThread:"create-thread",
    indUserProfile: "ind-user-profile",
    editUserPage: "edit-user-page"

  };
  //hiding all pages intially
  Object.keys(pageMapping).forEach(page => {
    document.getElementById(pageMapping[page]).style.display = "none";  
  });
  //hiding all errors if any from previous page
  closeThreadError();

  //showing target page
  if(targetPage === 'normal'){
    document.getElementById(pageMapping[targetPage]).style.display = "flex";

  }
  else{
    document.getElementById(pageMapping[targetPage]).style.display = "block";
  }
}

//method to display Create error thread
export const showCreateThreadError = (message) => {
  document.getElementById('createthread-error-popup').style.display = 'block';
  document.getElementById('create-thread-error-message').textContent = message;

}

export const closeThreadError = () => {
  document.getElementById('createthread-error-popup').style.display = 'none';
  document.getElementById('create-thread-error-message').textContent = '';
}

export function setupThreadEventListener() {
    
    //close thread error message
    document.getElementById('create-thread-close-popup').addEventListener('click',closeThreadError);
    //load more threads
    document.getElementById('thread-loadmore').addEventListener('click' , () => {
      nextThread+=5;
      getThreads(nextThread)
      .then(listofthreads => {
         
         showThread(listofthreads);
      })
      .catch(error => {
          console.error("Failed to fetch threads: ", error);
      })
    });

    document.getElementById('create-new-thread').addEventListener('click', () => {
        toggleThreadCreate(true);
    });

    document.getElementById('create-thread-submit').addEventListener('click', () => {
        const title = document.getElementById('create-thread-title').value;
        const isPublic = !(document.getElementById('create-thread-private').checked);
        const content = document.getElementById('create-thread-content').value;

        if (title.trim() === '' || content.trim() === ''){
            showCreateThreadError("Empty thread not permitted");
            return;
        }

        const token =  localStorage.getItem('token')

        // Send thread create data
      
        fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title,isPublic,content }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            
          console.log(data.error)
        } else {
      
            DisplayIndvThread(data.id);
            toggleThreadCreate(false);    
        }
    })
    .catch(error => {
        alert('Cannot create thread now');
    });
    });

    document.getElementById('cancel-create-thread').addEventListener('click', () => {
        toggleThreadCreate(false);
        
    });

    document.getElementById('go-back-to profile').addEventListener('click', () => {
      showLoggedinPages('normal');
    });
  }



 
  