import { BACKEND_PORT } from './config.js';
import { getCurrentUserIsAdmin, getLoggedInUser } from './main.js';
import { DisplayIndvThread, getUserDetails, showCreateThreadError } from './threadcreate.js';
import { getThreadDetail } from './threadcreate.js';
import { showUserProfile } from './User.js';


//parent function for all Comment Listeners
export const CommentListeners = () => {

  let ParentCommentId = null;
  let ParentCommentContent = "";

  //add a new comment
  document.getElementById('add-new-comment-submit').addEventListener('click', () =>{
    const ThreadId = (document.querySelector('.card-body.ind-thread-container').id); 
    const token =  localStorage.getItem('token');
    
    getThreadDetail(ThreadId)
      .then(details => {
        //if locked thread
        if (details.lock){

          showCreateThreadError('Thread Locked');
          return;
        }
        else{
          const content = document.getElementById('add-new-comment-text').value;

        // Send thread create data
      
          const PassObj = {
            "content":content,
            "threadId":ThreadId,
            "parentCommentId": null
          };

            fetch(`http://localhost:${BACKEND_PORT}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(PassObj),
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
            alert('An error occurred during. Please try again.')
        });
       }

    });
    
  });
  
  
  document.getElementById('ind-thread-comments').addEventListener('click', function(event){
    
    if (event.target && event.target.classList.contains('bi-reply')){
      
      ParentCommentId = event.target.id;
    }
    //fresh like
    else if (event.target.classList.contains('far')){
      likeCommentToggle(event.target.id,true);
    } 
    //already liked
    else if (event.target.classList.contains('fas')){
      likeCommentToggle(event.target.id,false);
    }
    else if (event.target.classList.contains('bi-pen')){
        ParentCommentId = event.target.id;
        ParentCommentContent = event.target.getAttribute('content-comment');
        document.getElementById('edit-comment-content').value = ParentCommentContent;
    }
    else if (event.target.classList.contains('user-image')){
      
      //requested user id
      const RequestedId = event.target.getAttribute('author-id')
      showUserProfile(RequestedId);
    }
    
  });
  //edit comment
  document.getElementById('edit-comment-submit').addEventListener('click', () => {
    const token =  localStorage.getItem('token');
    const content = document.getElementById('edit-comment-content').value;
    const ThreadId = (document.querySelector('.card-body.ind-thread-container').id); 

        // Send thread update data
        const sendObject = {
          "id": ParentCommentId,
          "content": content
        }
      
        fetch(`http://localhost:${BACKEND_PORT}/comment`, {
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

  //add replied comment
  document.getElementById('reply-comment-submit').addEventListener('click', (event) => {
    const token =  localStorage.getItem('token');
    const ThreadId = (document.querySelector('.card-body.ind-thread-container').id); 

    getThreadDetail(ThreadId)
      .then(details => {
        //if locked thread
        if (details.lock){
          alert('Thread locked');
          return;
        }
        const content = document.getElementById('reply-comment').value;

        // Send thread create data
      
          const PassObj = {
            "content":content,
            "threadId":ThreadId,
            "parentCommentId": Number(ParentCommentId)
          };

            fetch(`http://localhost:${BACKEND_PORT}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(PassObj),
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
            alert('An error occurred during Login. Please try again.')
        });

        //ending here
      });  
    
  });

};

//function for liking/unliking
const likeCommentToggle = (commentId,like) => {

  const token =  localStorage.getItem('token');
  const ThreadId = (document.querySelector('.card-body.ind-thread-container').id); 

  //setting data object
  const sendObject = {
    "id":commentId,
    "turnon":like
  };
  fetch(`http://localhost:${BACKEND_PORT}/comment/like`, {
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

}


//function for getting Comments for a thread
export const getThreadComments = threadId => {
    
    const token =  localStorage.getItem('token');

    return fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
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
      .then(comments => {
        
       //getCommentMapping(comments);
        return comments;
      })
      .catch(error => {
        console.error('Error fetching comments:', error);
      });
};

//function to map parent-child comment mapping
export const getCommentMapping = Comments =>{
    
    //setting children as []
    for (let i in Comments){
        Comments[i].children = [];

    }

    for(let i in Comments){
        //maps parents-child relation
        if(Comments[i].parentCommentId){
            let parentId = Comments[i].parentCommentId;
            //search for parent comment and map
            for(let j in Comments){
                if(Comments[j].id === parentId){
                    Comments[j].children.push(Comments[i]);
                }
            }
        }
    }
    //sorting comments by timestamp
    Comments.sort((c1,c2) => new Date(c2.time) - new Date(c1.time));
    return Comments;
}

//function generate dom for comments
export const getThreadCommentsDom = threadId => {
  return getThreadComments(threadId)
  .then(Comments => {
    let comments = getCommentMapping(Comments);
  
    let parentul = document.createElement('ul');

    for(let i in comments){
      
      //parent  id is null
      if(! comments[i].parentCommentId){

        //trying getting user's details        
        getUserDetails(Number(comments[i].creatorId))
        .then(userdetails => {
          //each individual li in a ul  
          let li = document.createElement('li');
          
          let CommentObj = {
            "commentId":comments[i].id,
            "authorId":comments[i].creatorId,
            "content":comments[i].content,
            "likes":comments[i].likes,
            "time":comments[i].createdAt,
            "authorName": userdetails.name,
            "authorImage":userdetails.image
          };

          li.appendChild(getCommentCard(CommentObj));
          if(comments[i].children.length){
            li.appendChild(getThreadChildDom(comments[i].children));
          }
          parentul.appendChild(li);

          
        }); 
        //end of user fetch
      }
    
    }
    
    return parentul;
  });
};

//Add elements
const getThreadChildDom = (children) =>{
  let parentul = document.createElement('ul');
  for (let i in children){

    //trying to fetch user details
    getUserDetails(children[i].creatorId)
    .then (userDetails => {
      let li = document.createElement('li');
      let CommentObj = {
        "commentId":children[i].id,
        "authorId":children[i].creatorId,
        "content":children[i].content,
        "likes":children[i].likes,
        "time":children[i].createdAt,
        "authorName": userDetails.name,
        "authorImage":  userDetails.image
      };
  
  
      li.appendChild(getCommentCard(CommentObj));
      
      if (children[i].children.length > 0){
        li.appendChild(getThreadChildDom(children[i].children));
      }
      parentul.appendChild(li);
  
    });
    //ending user fetch
  }
  return parentul;
}

 
const getCommentCard = (CommentObj) => {

  //getting current User id
  const loggedInUserId =  getLoggedInUser();
  
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card mb-4';
  cardDiv.style.width = '50%';
  
  //setting Id
  cardDiv.id = CommentObj.commentId;


  // Create the card body div
  const cardBodyDiv = document.createElement('div');
  cardBodyDiv.className = 'card-body';

  // Create the paragraph inside card body
  const paragraph = document.createElement('p');
  paragraph.textContent = CommentObj.content;

  // Create the d-flex container div
  const dFlexDiv = document.createElement('div');
  dFlexDiv.className = 'd-flex justify-content-between';

  // Create the first d-flex row for the avatar and name
  const firstRowDiv = document.createElement('div');
  firstRowDiv.className = 'd-flex flex-row align-items-center';

  const avatarImg = document.createElement('img');
  avatarImg.src = CommentObj.authorImage;
  avatarImg.className = 'user-image';
  avatarImg.alt = 'avatar';
  avatarImg.width = 25;
  avatarImg.height = 25;
  avatarImg.setAttribute('author-id',CommentObj.authorId);

  const nameParagraph = document.createElement('p');
  nameParagraph.className = 'small mb-0 ms-2';
  nameParagraph.textContent = CommentObj.authorName;

  // Append img and name paragraph to first row div
  firstRowDiv.appendChild(avatarImg);
  firstRowDiv.appendChild(nameParagraph);

  // Create the second d-flex row for upvote
  const secondRowDiv = document.createElement('div');
  secondRowDiv.className = 'd-flex flex-row align-items-center';
  
  //reply icon
  const replyIcon = document.createElement('i');
  replyIcon.className = 'bi bi-reply -reply-thread';
  replyIcon.id = CommentObj.commentId;
  replyIcon.setAttribute('data-toggle','modal');
  replyIcon.setAttribute('data-target','#replyComment');
  replyIcon.setAttribute('comment-id',CommentObj.commentId);
  
  //setting thumbs icon
  const thumbsUpIcon = document.createElement('i');
  thumbsUpIcon.className = 'far fa-thumbs-up mx-2 fa-xs text-body';
  for(let i in CommentObj.likes){
    
    //already liked
    if(CommentObj.likes[i] === loggedInUserId){
      thumbsUpIcon.className = 'fas fa-thumbs-up mx-2 fa-xs text-body';
      break;
    }
  }
  
  thumbsUpIcon.style.marginTop = '-0.16rem';
  thumbsUpIcon.id = CommentObj.commentId;

  const upvoteCount = document.createElement('p');
  upvoteCount.className = 'small text-muted mb-0';
  //upvoteCount.textContent = CommentObj.likes.length;
  upvoteCount.textContent = `${CommentObj.likes.length}  ${getCommentTimeLapse(CommentObj.time)}`;
  
  //conditionally add edit icon
  if (CommentObj.authorId === loggedInUserId || getCurrentUserIsAdmin()){
      
    const editIcon = document.createElement('i');
    editIcon.className = 'bi bi-pen --edit-thread';
    editIcon.id = CommentObj.commentId;
    editIcon.setAttribute('data-toggle','modal');
    editIcon.setAttribute('data-target','#editComment');
    editIcon.setAttribute('content-comment',CommentObj.content);
    secondRowDiv.appendChild(editIcon);  
  }
  // Append upvote text, thumbs up icon, and upvote count to second row div
  secondRowDiv.appendChild(replyIcon);
  secondRowDiv.appendChild(thumbsUpIcon);
  secondRowDiv.appendChild(upvoteCount);

  // Append first and second row divs to d-flex container div
  dFlexDiv.appendChild(firstRowDiv);
  dFlexDiv.appendChild(secondRowDiv);

  // Append paragraph and d-flex container div to card body
  cardBodyDiv.appendChild(paragraph);
  cardBodyDiv.appendChild(dFlexDiv);

  // Append card body to main card div
  cardDiv.appendChild(cardBodyDiv);

  return cardDiv;
};

const getCommentTimeLapse = (commentTime) => {
  const now = new Date();

  const timeDiff = Math.floor((now - new Date(commentTime)) / 1000);
  if (timeDiff < 60){
    return "Just now";
  }
  
  const intervals = [
    { label: 'week', seconds: 604800 },   // 7 * 24 * 60 * 60
    { label: 'day', seconds: 86400 },     // 24 * 60 * 60
    { label: 'hour', seconds: 3600 },     // 60 * 60
    { label: 'minute', seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(timeDiff / interval.seconds);
    if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
};