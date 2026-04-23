import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { GeneralContext } from '../../context/GeneralContext';

const ProjectWorking = () => {
  const { socket } = useContext(GeneralContext);
  const params = useParams();
  const BASE_URI = import.meta.env.VITE_API_URL;

  const [project, setProject] = useState();
  const [clientId, setClientId] = useState(localStorage.getItem('userId'));
  const [projectId, setProjectId] = useState(params['id']);

  useEffect(() => { document.title = "Project Working - KaamSetu"; }, []);

  useEffect(() => {
    fetchProject(params['id']);
  }, [params]);

  const joinSocketRoom = async () => {
    if (!socket) {
      return;
    }

    socket.emit("join-chat-room-client", { projectId: params['id'] });
  };

  const fetchProject = async (id) => {
    await axios.get(`${BASE_URI}/fetch-project/${id}`).then(
      (response) => {
        setProject(response.data);
        setProjectId(response.data._id);
        setClientId(response.data.clientId);
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  const handleApproveSubmission = async () => {
    await axios.get(`${BASE_URI}/approve-submission/${params['id']}`).then(
      () => {
        fetchProject(params['id']);
        alert("Submission approved!!");
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  const handleRejectSubmission = async () => {
    await axios.get(`${BASE_URI}/reject-submission/${params['id']}`).then(
      () => {
        fetchProject(params['id']);
        alert("Submission rejected!!");
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  const [message, setMessage] = useState('');

  const handleMessageSend = async () => {
    if (!socket || !message.trim()) {
      return;
    }

    socket.emit("new-message", { projectId: params['id'], senderId: localStorage.getItem("userId"), message, time: new Date() });
    setMessage("");
  };

  useEffect(() => {
    fetchChats();
  }, [params]);

  const [chats, setChats] = useState();
  const fetchChats = async () => {
    await axios.get(`${BASE_URI}/fetch-chats/${params['id']}`).then(
      (response) => {
        setChats(response.data);
      }
    );
  };

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleMessagesUpdated = ({ chat, chats }) => {
      setChats(chat || chats);
    };

    const handleMessageFromUser = () => {
      fetchChats();
    };

    joinSocketRoom();
    socket.on("messages-updated", handleMessagesUpdated);
    socket.on("message-from-user", handleMessageFromUser);

    return () => {
      socket.off("messages-updated", handleMessagesUpdated);
      socket.off("message-from-user", handleMessageFromUser);
    };
  }, [socket, params]);

  return (
    <>
      {project ? (
        <div className="theme-page-shell page-scroll-frame m-3 flex flex-col gap-5 rounded-2xl p-4 sm:m-5 sm:p-5 lg:flex-row">
          <div className="relative flex w-full flex-col gap-5 lg:w-2/3">
            <div className='theme-card flex min-h-[150px] flex-col overflow-auto rounded-xl p-4 scrollbar-hide'>
              <h3 className='theme-heading mb-3 text-lg font-bold'>{project.title}</h3>
              <p className='mb-2 text-sm'>{project.description}</p>
              <span>
                <h5 className='font-bold'>Required skills</h5>
                <div className="required-skills">
                  {project.skills.map((skill) => (
                    <span key={skill} className='theme-chip mr-2'>{skill}</span>
                  ))}
                </div>
              </span>
              <span>
                <h6 className='mb-2 text-sm'>Budget: &#8377; {project.budget}</h6>
              </span>
            </div>

            {project.freelancerId && project.freelancerId !== "" ? (
              <div className="theme-card flex flex-1 flex-col rounded-xl p-4">
                <h4 className='theme-heading mb-5 text-2xl font-bold'>Submission</h4>
                <div className="project-submissions">
                  {project.submission ? (
                    <div className="project-submission">
                      <span className='mb-3 flex gap-2'>
                        <h5 className='font-bold'>Project Link: </h5>
                        <a className='theme-link' href={project.projectLink} target='_blank' rel="noreferrer">{project.projectLink}</a>
                      </span>

                      <span className='mb-3 flex gap-2'>
                        <h5 className='font-bold'>Manual Link: </h5>
                        <a className='theme-link' href={project.manualLink} target='_blank' rel="noreferrer">{project.manualLink}</a>
                      </span>

                      <h5 className='font-bold'>Description for work :</h5>
                      <p className='mb-5'>{project.submissionDescription}</p>

                      {project.submissionAccepted ? (
                        <h5 className="theme-status-complete">project completed!!</h5>
                      ) : (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button className='theme-button-primary px-4 py-2' onClick={handleApproveSubmission}>Approve</button>
                          <button className='theme-button-secondary px-4 py-2' onClick={handleRejectSubmission}>Reject</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className='theme-muted-text text-center'>No submissions yet!!</p>
                  )}
                </div>
              </div>
            ) : ""}
          </div>
          <div className="theme-chat-shell relative flex w-full min-h-[500px] flex-col rounded-2xl p-4 lg:w-1/3 lg:min-h-[70vh]">
            <h4 className='theme-heading mb-3 text-lg font-bold'>Chat with the Freelancer</h4>
            <hr className='theme-panel-divider mb-3' />
            {project.freelancerId ? (
              <div className="chat-body relative flex h-[90%] flex-col gap-2">
                {chats ? (
                  <div className="chat-messages flex h-[480px] flex-col gap-2 overflow-y-scroll scrollbar-hide lg:h-[70vh]">
                    {chats.messages.map((chatMessage) => {
                      const isSent = chatMessage.senderId === localStorage.getItem("userId");
                      return (
                        <div key={chatMessage.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-lg p-2 ${isSent ? "theme-chat-self text-right" : "theme-chat-other text-left"}`}>
                            <p className='text-sm'>{chatMessage.text}</p>
                            <h6 className='text-xs'>{chatMessage.time.slice(5, 10)} - {chatMessage.time.slice(11, 19)}</h6>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : ""}
                <div className="theme-chat-composer relative bottom-0 left-0 right-0 flex justify-between gap-2 rounded-2xl p-3 sm:p-4">
                  <input className='theme-chat-input h-14 w-full rounded-4xl border p-2 sm:h-16' type="text" placeholder='Enter something...' value={message} onChange={(e) => setMessage(e.target.value)} />
                  <button className='theme-button-accent rounded-4xl px-4 py-2 shrink-0' onClick={handleMessageSend}>Send</button>
                </div>
              </div>
            ) : (
              <i>Chat will be enabled if the freelancer accepts the project!!</i>
            )}
          </div>
        </div>
      ) : ""}
    </>
  );
};

export default ProjectWorking;
