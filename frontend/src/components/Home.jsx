import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client';
const socket = io('https://flashtalk-backend.vercel.app');



function Home() {
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [senderSocketId, setSenderSocketId] = useState(null);
    const [recipientSocketId, setRecipientSocketId]=useState('')
    const [recipientId, setRecipientId] = useState('');
    const [recipientUsername, setRecipientUsername]=useState('')
    const [updateUsers, setUpdateUsers]=useState('')
    const [onlineUsers, setOnlineUsers]=useState([])

    const loggedInUser = JSON.parse(localStorage.getItem('user'))

    useEffect(()=>{
        socket.on('getOnlineUsers', (obj)=>{
            setOnlineUsers(Object.keys(obj))
        })
    },[])

    useEffect(()=>{

        socket.emit('getPreviousMessages', { senderId: loggedInUser._id, receiverId: recipientId });

        // Listening for previous messages
        socket.on('previousMessages', (msgObj) => {
            setMessages(msgObj)
            console.log(msgObj.sender.userId);
            
        });
        
    },[recipientSocketId])

    

   console.log(onlineUsers.includes(loggedInUser._id))

    useEffect(() => {
    

        const promise = new Promise((resolve, reject)=>{
            if(socket.connected){
                resolve(socket.id)
            }else{
                socket.on('connect', ()=>{
                    resolve(socket.id)
                })
            }
        })

        promise.then((res)=>{socket.emit('updateSocketId', {userId:loggedInUser._id, socketId:res}); setSenderSocketId(res)})

        

            socket.on('isUpdated', (flag)=>{
                flag ? console.log('socket id updated in database') : alert('unable to store socket id in database')
            })

            socket.on('receiveMessage', (msg) => {
                console.log(msg)
            })

            socket.on('socketChanged', (id)=>{
                setUpdateUsers(id)
            })

        // socket.on('connect', () => {
        //     setSenderSocketId(socket.id)
        //     console.log(loggedInUser._id, socket.id);
              
        //     if (loggedInUser && loggedInUser._id) {
                
        //         socket.emit('updateSocketId', {userId:loggedInUser._id, socketId:socket.id});
        //     } else {
        //         console.log('User _id is missing');
        //     }

        //     socket.on('isUpdated', (flag)=>{
        //         flag ? console.log('socket id updated in database') : alert('unable to store socket id in database')
        //     })

        //     socket.on('recieveMessage', (msg) => {
        //         console.log('revieved msg..', msg)
        //     })

        // });


        getUsers()


        // const spromis = new Promise((resolve, reject)=>{
        //     socket.on('connect', ()=>{
        //         if (socket.connected) {
        //             // If socket is already connected, resolve immediately
        //             resolve(socket.id);
        //         } else {
        //             // Otherwise, wait for the 'connect' event
        //             socket.on('connect', () => {
        //                 resolve(socket.id);
        //             });
        //         }
        //     })
        // })
    
        // spromis.then((response)=>{console.log( 'promise resolved', response)})

      
    }, [])

  

   useEffect(()=>{
    return ()=>{
        socket.emit('userGoingOffline', true)
    }
   },[])

   

 useEffect(()=>{
    onlineUsers.map((user)=>{
        console.log(user)
    })
 },[onlineUsers])



    useEffect(() => {
        socket.on('receiveMessage', (msgObj) => {
            console.log(msgObj);
            
            setMessages((prevMessages) => [...prevMessages, msgObj]);
        });

        socket.on('broadcast', (msg)=>{
            alert(msg)
        })

      

        return () => {
            socket.off('receiveMessage');
        };
    }, []);





    const getUsers = () => {
        fetch('https://flashtalk-backend.vercel.app/getUsers')
            .then((response) => { return response.json() })
            .then((data) => {
                if (data.message == 'all users') {
                    setConnectedUsers(data.users)
                }
            })
            .catch((err) => { alert('error gettin all users...') })
    }

    const sendMessage = () => {
        if (message && recipientId) {
            const msgObject = {
                sender:{username:loggedInUser.username, userId:loggedInUser._id,},
                receiver:{username:recipientUsername, userId:recipientId},
                fromSocket:senderSocketId,
                toSocket:recipientSocketId,
                content:message
                }

            socket.emit('sendMessage', msgObject);
            setMessages((prevMessages) => [...prevMessages, msgObject]);
            setMessage('');
        }
    };

    const getRecipientSocketId = (userId) =>{
        fetch('https://flashtalk-backend.vercel.app/getRecipientSocketId', {method:'post', headers:{'Content-Type': 'application/json'}, body:JSON.stringify({userId:userId})})
        .then((response) => { return response.json() })
        .then((data) => { 
            data.user.socketId!=='' ? setRecipientSocketId(data.user.socketId): alert(`${data.user.username} is offline...`)
            console.log(data.user.socketId)
        })
        .catch((err) => { alert('Error gettin user...') })
    }








    return (

        <div className='flex gap-2 w-screen h-screen p-2'>
            <div className="recentChats overflow-y-auto flex gap-2 flex-col rounded-lg w-[20%] p-2 bg-slate-600">

                {
                    connectedUsers && connectedUsers.map((user, index) => (
                        <div key={index} className={` ${loggedInUser.username === user.username ? 'hidden' : 'flex'} items-center gap-4 p-3 border  ${onlineUsers.includes(user._id) ? 'bg-green-400' : 'bg-slate-400'}  cursor-pointer rounded-lg hover:bg-gray-100 transition duration-200`} onClick={() => {getRecipientSocketId(user._id), setRecipientId(user._id), setRecipientUsername(user.username)}} >
                            <span className='profilePhoto w-[50px] h-[50px] border border-gray-300 rounded-full bg-gray-300 flex items-center justify-center'>
                                <span className='text-gray-600 font-semibold'>{user.username.charAt(0)}</span>
                            </span>
                            <span className='userName text-gray-800 font-semibold'>{user.username}</span>
                        </div>
                    ))


                }

            </div>

            <div className="chatWindowAndInputBox rounded-lg flex flex-col gap-2 w-[80%] h-full">
            <div className="chat border h-full rounded-lg bg-slate-600 p-4 overflow-y-auto">
  {messages.map((msgObject, index) => (
    <div
      key={index}
      className={`flex mb-2 ${msgObject.sender?.userId === loggedInUser._id ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`relative max-w-[75%] p-2 rounded-lg text-white ${
          msgObject.sender.userId === loggedInUser._id
            ? 'bg-purple-600'
            : 'bg-pink-600'
        }`}
      >
        {msgObject.content}
      </div>
    </div>
  ))}
</div>


                <div className='flex justify-between gap-2 h-[50px] w-full'>
                    <input className='w-full rounded-lg text-lg pl-2 bg-slate-600' type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
                    <button className='bg-slate-600 text-white font-semibold px-6 rounded-lg' onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    )
}

export default Home