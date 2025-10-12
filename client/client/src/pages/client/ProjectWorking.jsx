import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { GeneralContext } from '../../context/GeneralContext';

const ProjectWorking = () => {

  const { socket } = useContext(GeneralContext);
  const params = useParams();
  const BASE_URI = import.meta.env.VITE_API_URL;

  console.log(params['id']);

  const [project, setProject] = useState();
  const [clientId, setClientId] = useState(localStorage.getItem('userId'));
  const [projectId, setProjectId] = useState(params['id']);

  useEffect(() => {
    fetchProject(params['id']);
    joinSocketRoom();
  }, [])

  const joinSocketRoom = async () => {
    await socket.emit("join-chat-room", { projectId: params['id'], freelancerId: "" });
  }

  useEffect(() => {
    fetchProject(params['id']);
  }, [])

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

  const handleApproveSubmission = async () => {
    await axios.get(`${BASE_URI}/approve-submission/${params['id']}`).then(
      (response) => {
        fetchProject(params['id']);
        alert("Submission approved!!");
      }
    ).catch((err) => {
      console.log(err);
    })
  }

  const handleRejectSubmission = async () => {
    await axios.get(`${BASE_URI}/reject-submission/${params['id']}`).then(
      (response) => {
        fetchProject(params['id']);
        alert("Submission rejected!!");
      }
    ).catch((err) => {
      console.log(err);
    })
  }

  const [message, setMessage] = useState('');

  const handleMessageSend = async () => {
    socket.emit("new-message", { projectId: params['id'], senderId: localStorage.getItem("userId"), message, time: new Date() })
    setMessage("");
    fetchChats();
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
          <div className="w-2/3 h-full flex flex-col gap-5 relative">
            <div className='border border-[#2A652E] p-4 rounded-lg flex flex-col h-1/3'>
              <h3 className='text-lg font-bold mb-3 text-green-600'>{project.title}</h3>
              <p className='text-sm mb-2'>{project.description}</p>
              <span>
                <h5 className='font-bold'>Required skills</h5>
                <div className="required-skills">
                  {project.skills.map((skill) => (
                    <p key={skill}>{skill}</p>
                  ))}
                </div>
              </span>
              <span>
                <h6 className='text-sm mb-2'>  Budget: &#8377; {project.budget}</h6>
              </span>
            </div>

            {project.freelancerId && project.freelancerId !== "" ?

              <div className="h-2/3 border border-[#2A652E] p-4 rounded-lg flex flex-col flex-1">

                <h4 className='font-bold text-2xl mb-5'>Submission</h4>

                <div className="project-submissions">

                  {project.submission ?

                    <div className="project-submission">

                      <span className='flex gap-2 mb-3'>
                        <h5 className='font-bold'>Project Link: </h5>
                        <a className='text-blue-500 hover:underline' href={project.projectLink} target='_blank' >{project.projectLink}</a>
                      </span>

                      <span className='flex gap-2 mb-3'>
                        <h5 className='font-bold'>Manual Link: </h5>
                        <a className='text-blue-500 hover:underline' href={project.manulaLink} target='_blank'>{project.manulaLink}</a>
                      </span>


                      <h5 className='font-bold'>Description for work :</h5>
                      <p className='mb-5'>{project.submissionDescription}</p>

                      {project.submissionAccepted ?
                        <h5 style={{ color: "green" }} >project completed!!</h5>
                        :

                        <div className="flex gap-2">
                          <button className='bg-green-500 text-white px-4 py-2 rounded-lg' onClick={handleApproveSubmission} >Approve </button>
                          <button className='bg-red-500 text-white px-4 py-2 rounded-lg' onClick={handleRejectSubmission} >Reject</button>
                        </div>
                      }

                    </div>
                    :
                    <p className='text-center text-gray-500'>No submissions yet!!</p>
                  }
                </div>

              </div>
              : ""}
          </div>
          <div className="w-1/3 h-full relative border border-[#2A652E] p-4 rounded-lg flex flex-col ">

            <h4 className='text-lg font-bold mb-3'>Chat with the Freelancer</h4>
            <hr />
            {project.freelancerId ?

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
                            className={`p-2 rounded-lg max-w-[70%] ${isSent
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
                  <input className='w-3/4 h-16 rounded-4xl border border-gray-500 p-2' type="text" placeholder='Enter something...' value={message} onChange={(e) => setMessage(e.target.value)} />
                  <button className='bg-blue-500 text-white px-2 py-2 rounded-4xl w-1/4' onClick={handleMessageSend} >Send</button>
                </div>

              </div>
              :
              <i >Chat will be enabled if the project is assigned to you!!</i>
            }

          </div>

        </div>
        : ""}
    </>
  )
}

export default ProjectWorking