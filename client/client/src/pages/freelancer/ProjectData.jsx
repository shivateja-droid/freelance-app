import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { GeneralContext } from '../../context/GeneralContext';


const ProjectData = () => {

  const { socket } = useContext(GeneralContext);
  const params = useParams();
  const [project, setProject] = useState()
  const BASE_URI = import.meta.env.VITE_API_URL;

  console.log(params['id']);

  useEffect(() => {
    fetchProject(params['id']);
    joinSocketRoom();
  }, [])

  const joinSocketRoom = async () => {
    await socket.emit("join-chat-room", { projectId: params['id'], freelancerId: localStorage.getItem("userId") });
  }

  const fetchProject = async (id) => {
    await axios.get(`${BASE_URI}/fetch-project/${id}`).then(
      (response) => {
        setProject(response.data);
        setProjectId(response.data._id);
        setClientId(response.data.clientId);
        console.log(response.data);
      }
    ).catch((err) => {
      console.log(err);
    })
  }

  const [clientId, setClientId] = useState('');
  const [freelancerId, setFreelancerId] = useState(localStorage.getItem('userId'));
  const [projectId, setProjectId] = useState(params['id']);
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');

  const handleBidding = async () => {

    await axios.post(`${BASE_URI}/make-bid`, { clientId, freelancerId, projectId, proposal, bidAmount, estimatedTime }).then(
      (response) => {
        setProposal('');
        setBidAmount(0);
        setEstimatedTime(0);
        alert("Bidding successful!!");
      }
    ).catch((err) => {
      alert("Bidding failed!! Try again!");
    })

  }

  const [projectLink, setProjectLink] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');

  const handleProjectSubmission = async () => {

    await axios.post(`${BASE_URI}/submit-project`, { clientId, freelancerId, projectId, projectLink, manualLink, submissionDescription }).then(
      (response) => {
        setProjectLink('');
        setManualLink('');
        setSubmissionDescription('');
        alert("submission successful!!");
      }
    ).catch((err) => {
      alert("submission failed!! Try again!");
    })

  }
  const [message, setMessage] = useState('');

  const handleMessageSend = async () => {
    socket.emit("new-message", { projectId: params['id'], senderId: localStorage.getItem("userId"), message, time: new Date() });
    fetchChats();
    setMessage("");
  }

  useEffect(() => {
    fetchChats();
  }, [])

  const [chats, setChats] = useState();

  const fetchChats = async () => {
    await axios.get(`${BASE_URI}/fetch-chats/${params['id']}`).then(
      (response) => {
        setChats(response.data);
      }
    )
  }

  useEffect(() => {
    socket.on("message-from-user", () => {
      fetchChats();
    })
  }, [socket])


  return (

    <>
      {project ?

        <div className="h-[90vh] m-5 p-5 border-2 border-[#2A652E] shadow-lg rounded-lg overflow-y-scroll flex gap-5">

          <div className="w-2/3 h-full flex flex-col gap-5">

            <div className='border border-[#2A652E] p-4 rounded-lg flex flex-col flex-1 min-h-[150px]'>
              <h3 className='text-lg font-bold mb-3 text-green-600'>{project.title}</h3>
              <p className='text-sm mb-2'>{project.description}</p>
              <span>
                <h5 className='font-bold'>Required skills</h5>
                <div className='text-sm mb-2'>
                  {project.skills.map((skill) => (
                    <p key={skill}>{skill}</p>
                  ))}
                </div>
              </span>
              <span>
                <h6 className='text-sm mb-2'>  Budget: &#8377; {project.budget}</h6>
              </span>
            </div>

            {/* Freelancer proposal */}

            {project.status === "Available" ?

              <div className="flex flex-col border border-[#2A652E] p-4 rounded-lg min-h-[150px]">
                <h4 className='text-lg font-bold mb-3'>Send proposal</h4>
                <div className='flex gap-5'>
                  <div className='w-1/3 mb-6'>
                    <label htmlFor="Budget" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Budget in ₹</label>
                    <input onChange={(e) => setBidAmount(e.target.value)} value={bidAmount} type="number" id="Budget" aria-describedby="helper-text-explanation" className="bg-[#A9DBAC] border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="90210" required />
                  </div>
                  <div className='w-1/3 mb-6'>
                    <label htmlFor="EstimatedTime" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Estimated time (in days)</label>
                    <input onChange={(e) => setEstimatedTime(e.target.value)} value={estimatedTime} type="number" id="EstimatedTime" aria-describedby="helper-text-explanation" className="bg-[#A9DBAC] border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="5" required />
                  </div>
                </div>
                <div className='mb-6'>
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Describe your proposal</label>
                  <textarea onChange={(e) => setProposal(e.target.value)} value={proposal} id="description" rows="4" className="block p-2.5 w-full text-sm text-gray-900 bg-[#A9DBAC] rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write your proposal here..."></textarea>
                </div>
                {!project.bids.includes(localStorage.getItem('userId')) ? <button className='bg-[#2A652E] text-white font-bold py-2 px-4 rounded' onClick={handleBidding} >Post Bid</button> : ""}
                {project.bids.includes(localStorage.getItem('userId')) ? <button className='bg-gray-400 text-white font-bold py-2 px-4 rounded' disabled >Already bidded</button> : ""}
              </div>
              : ""}

            {project.freelancerId === localStorage.getItem('userId') ?

              <div className="h-2/3 border border-[#2A652E] p-4 rounded-lg flex flex-col flex-1">

                <h4 className='text-2xl font-bold mb-3'>Submit the project</h4>

                {project.submissionAccepted ?
                  <p className='text-sm mb-2 text-green-500 text-center'>Project completed</p>
                  :

                  <>
                    <div className="mb-6">
                      <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Project link</label>
                      <input onChange={(e) => setProjectLink(e.target.value)} value={projectLink} type="text" id="small-input" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-[#A9DBAC]  text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-[#A9DBAC]  dark:border-gray-600 dark:placeholder-gray-900 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                    </div>
                    <div className="mb-6">
                      <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Manual link</label>
                      <input onChange={(e) => setManualLink(e.target.value)} value={manualLink} type="text" id="small-input" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-[#A9DBAC]  text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-[#A9DBAC]  dark:border-gray-600 dark:placeholder-gray-900 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                    </div>
                    <div className='mb-6'>
                      <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Describe your work</label>
                      <textarea onChange={(e) => setSubmissionDescription(e.target.value)} value={submissionDescription} id="description" rows="4" className="block p-2.5 w-full text-sm text-gray-900 bg-[#A9DBAC] rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write your description here..."></textarea>
                    </div>

                    {project.submission ?

                      <button className='bg-gray-400 text-white font-bold py-2 px-4 rounded' disabled >Already submitted</button>
                      :
                      <button className='bg-[#2A652E] text-white font-bold py-2 px-4 rounded' onClick={handleProjectSubmission} >Submit project</button>
                    }
                  </>
                }
              </div>
              : ""}
          </div>

          <div className="w-1/3 h-full relative border border-[#2A652E] p-4 rounded-lg flex flex-col">

            <h4 className='text-lg font-bold mb-3'>Chat with the client</h4>
            <hr />

            {project.freelancerId === localStorage.getItem('userId') ?

              <div className="chat-body h-full relative flex flex-col gap-2 ">

                {chats ?

                  <div className="chat-messages flex flex-col gap-2 h-[70vh] overflow-y-scroll scrollbar-hide">
                    {chats.messages.map((message) => {
                      const isSent = message.senderId === localStorage.getItem("userId");
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`p-2 rounded-lg max-w-[70%] ${
                              isSent
                                ? "bg-green-200 text-right"
                                : "bg-red-200 text-left"
                            }`}
                          >
                            <p className='text-sm'>{message.text}</p>
                            <h6 className='text-xs'>{message.time.slice(5, 10)} - {message.time.slice(11, 19)}</h6>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  : ""}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between gap-2 bg-white">
                  <input className='w-3/4 h-16 rounded-4xl border border-gray-500 p-2' type="text"  placeholder='Enter something...' value={message} onChange={(e) => setMessage(e.target.value)} />
                  <button className='bg-blue-500 text-white px-2 py-2 rounded-4xl w-1/4' onClick={handleMessageSend} >Send</button>
                </div>

              </div>
              :
              <i>Chat will be enabled if the project is assigned to you!!</i>
            }
          </div>
        </div>
        : ""}
    </>
  )
}

export default ProjectData