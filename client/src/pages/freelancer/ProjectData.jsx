import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '../../utils/notifications.js';
import { GeneralContext } from '../../context/GeneralContext';

const ProjectData = () => {
  const { socket } = useContext(GeneralContext);
  const params = useParams();
  const [project, setProject] = useState();
  const [projectId, setProjectId] = useState(params['id']);
  const [projectLoadState, setProjectLoadState] = useState('loading');
  const BASE_URI = import.meta.env.VITE_API_URL;
  const canAccessChat = project?.freelancer === localStorage.getItem('userId');
  const [hasApplied, setHasApplied] = useState(false);

  const fetchProject = useCallback(async (id) => {
    setProjectLoadState('loading');
    setProject(undefined);
    setHasApplied(false);
    try {
      const response = await axios.get(`${BASE_URI}/fetch-project/${id}`);
      setProject(response.data);
      setProjectId(response.data._id);
      setProjectLoadState('ready');
      return response.data;
    } catch (error) {
      setProjectLoadState(error?.response?.status === 404 ? 'not-found' : 'error');
      toast.error(error?.response?.status === 404
        ? 'Project not found.'
        : getSafeErrorMessage(error, 'Unable to load this project.'));
      return null;
    }
  }, [BASE_URI]);

  useEffect(() => {
    fetchProject(params['id']);
  }, [fetchProject, params]);

  useEffect(() => { document.title = "Project Details - KaamSetu"; }, []);

  const joinSocketRoom = async () => {
    if (!socket) {
      return;
    }

    socket.emit("join-chat-room", { projectId: params['id'] });
  };

  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const bidLock = useRef(false);

  const handleBidding = async () => {
    if (bidLock.current) return;
    bidLock.current = true;
    setIsSubmittingBid(true);
    try {
      await axios.post(`${BASE_URI}/make-bid`, { projectId, proposal, bidAmount, estimatedTime });
      setProposal('');
      setBidAmount('');
      setEstimatedTime('');
      setHasApplied(true);
      toast.success('Bid submitted successfully.');
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Unable to submit your bid.'));
    } finally {
      bidLock.current = false;
      setIsSubmittingBid(false);
    }
  };

  useEffect(() => {
    if (projectLoadState !== 'ready') return;

    const fetchMyApplications = async () => {
      try {
        const response = await axios.get(`${BASE_URI}/fetch-applications`);
        setHasApplied(response.data.some((application) => (
          application.project === params['id']
          && ['Pending', 'Accepted'].includes(application.status)
        )));
      } catch (error) {
        toast.error(getSafeErrorMessage(error, 'Unable to load your applications.'));
      }
    };

    fetchMyApplications();
  }, [BASE_URI, params, projectLoadState]);

  const [projectLink, setProjectLink] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  const handleProjectSubmission = async () => {
    if (isSubmittingProject) return;
    setIsSubmittingProject(true);
    try {
      await axios.post(`${BASE_URI}/submit-project`, { projectId, projectLink, manualLink, submissionDescription });
      setProjectLink('');
      setManualLink('');
      setSubmissionDescription('');
      const refreshedProject = await fetchProject(params['id']);
      if (refreshedProject) toast.success('Project submitted successfully.');
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Unable to submit the project.'));
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const [message, setMessage] = useState('');

  const handleMessageSend = async () => {
    if (!socket || !message.trim()) {
      return;
    }

    socket.emit("new-message", { projectId: params['id'], message });
    setMessage("");
  };

  useEffect(() => {
    if (canAccessChat) {
      fetchChats();
    }
  }, [params, canAccessChat]);

  const [chats, setChats] = useState();

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${BASE_URI}/fetch-chats/${params['id']}`);
      setChats(response.data);
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Unable to load chat messages.'));
    }
  };

  useEffect(() => {
    if (!socket || !canAccessChat) {
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
  }, [socket, params, canAccessChat]);

  if (projectLoadState === 'loading') {
    return <div className="theme-page-shell m-3 rounded-2xl p-4 text-center theme-muted-text">Loading project...</div>;
  }

  if (projectLoadState === 'not-found') {
    return <div className="theme-page-shell m-3 rounded-2xl p-4 text-center theme-muted-text">Project not found.</div>;
  }

  if (projectLoadState === 'error') {
    return <div className="theme-page-shell m-3 rounded-2xl p-4 text-center theme-muted-text">Unable to load this project. Please try again.</div>;
  }

  return (
    <div className="theme-page-shell page-scroll-frame m-3 flex flex-col gap-5 rounded-2xl p-4 sm:m-5 sm:p-5 lg:flex-row">
          <div className="relative flex w-full flex-col gap-5 lg:w-2/3">
            <div className='theme-card flex min-h-[150px] flex-1 flex-col overflow-auto rounded-xl p-4 scrollbar-hide'>
              <h3 className='theme-heading mb-1 text-lg font-bold'>{project.title}</h3>
              <p className='mb-1 text-sm'>{project.description}</p>
              <span>
                <h5 className='font-bold'>Required skills</h5>
                <div className='mb-1 text-sm'>
                  {project.skills.map((skill) => (
                    <span key={skill} className='theme-chip mr-2'>{skill}</span>
                  ))}
                </div>
              </span>
              <span>
                <h6 className='mb-1 text-sm'>Budget: &#8377; {project.budget}</h6>
              </span>
            </div>

            {project.status === "Available" ? (
              <div className="theme-card flex min-h-[150px] flex-col rounded-xl p-4">
                <h4 className='theme-heading mb-3 text-lg font-bold'>Send proposal</h4>
                <div className='flex flex-col gap-5 sm:flex-row'>
                  <div className='mb-6 w-full sm:w-1/3'>
                    <label htmlFor="Budget" className="theme-heading mb-2 block text-sm font-medium">Budget in ₹</label>
                    <input onChange={(e) => setBidAmount(e.target.value === '' ? '' : Number(e.target.value))} value={bidAmount} type="number" min="0.01" step="0.01" id="Budget" aria-describedby="helper-text-explanation" className="theme-input block w-full rounded-xl p-2.5 text-sm" placeholder="90210" required />
                  </div>
                  <div className='mb-6 w-full sm:w-1/3'>
                    <label htmlFor="EstimatedTime" className="theme-heading mb-2 block text-sm font-medium">Estimated time (in days)</label>
                    <input onChange={(e) => setEstimatedTime(e.target.value === '' ? '' : Number(e.target.value))} value={estimatedTime} type="number" min="1" step="1" id="EstimatedTime" aria-describedby="helper-text-explanation" className="theme-input block w-full rounded-xl p-2.5 text-sm" placeholder="5" required />
                  </div>
                </div>
                <div className='mb-6'>
                  <label htmlFor="description" className="theme-heading mb-2 block text-sm font-medium">Describe your proposal</label>
                  <textarea onChange={(e) => setProposal(e.target.value)} value={proposal} id="description" rows="4" className="theme-textarea block w-full rounded-xl p-2.5 text-sm" placeholder="Write your proposal here..."></textarea>
                </div>
                {!hasApplied ? <button className='theme-button-primary px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-60' disabled={isSubmittingBid} onClick={handleBidding}>{isSubmittingBid ? 'Submitting...' : 'Post Bid'}</button> : ""}
                {hasApplied ? <button className='theme-button-muted px-4 py-2 font-bold' disabled>Already bidded</button> : ""}
              </div>
            ) : ""}

            {project.freelancer === localStorage.getItem('userId') ? (
              <div className="theme-card flex flex-1 flex-col rounded-xl p-4">
                <h4 className='theme-heading mb-3 text-2xl font-bold'>Submit the project</h4>

                {project.submissionAccepted ? (
                  <p className='theme-status-complete mb-2 text-center text-sm'>Project completed</p>
                ) : (
                  <>
                    <div className="mb-6">
                      <label htmlFor="small-input" className="theme-heading mb-2 block text-sm font-medium">Project link</label>
                      <input onChange={(e) => setProjectLink(e.target.value)} value={projectLink} type="url" id="small-input" className="theme-input block w-full rounded-xl p-2 text-xs" />
                    </div>
                    <div className="mb-6">
                      <label htmlFor="manual-input" className="theme-heading mb-2 block text-sm font-medium">Manual link</label>
                      <input onChange={(e) => setManualLink(e.target.value)} value={manualLink} type="url" id="manual-input" className="theme-input block w-full rounded-xl p-2 text-xs" />
                    </div>
                    <div className='mb-6'>
                      <label htmlFor="submission-description" className="theme-heading mb-2 block text-sm font-medium">Describe your work</label>
                      <textarea onChange={(e) => setSubmissionDescription(e.target.value)} value={submissionDescription} id="submission-description" rows="4" className="theme-textarea block w-full rounded-xl p-2.5 text-sm" placeholder="Write your description here..."></textarea>
                    </div>

                    {project.submission ? (
                      <button className='theme-button-muted px-4 py-2 font-bold' disabled>Already submitted</button>
                    ) : (
                      <button className='theme-button-primary disabled:cursor-not-allowed px-4 py-2 font-bold' disabled={isSubmittingProject || projectLink.length < 3 || manualLink.length < 3} onClick={handleProjectSubmission}>{isSubmittingProject ? 'Submitting...' : 'Submit project'}</button>
                    )}
                  </>
                )}
              </div>
            ) : ""}
          </div>

          <div className="theme-chat-shell relative flex w-full min-h-[500px] flex-col rounded-2xl p-4 lg:w-1/3 lg:min-h-[70vh]">
            <h4 className='theme-heading mb-3 text-lg font-bold'>Chat with the client</h4>
            <hr className='theme-panel-divider mb-3' />

            {project.freelancer === localStorage.getItem('userId') ? (
              <div className="chat-body relative flex h-[90%] flex-col gap-2">
                {chats ? (
                  <div className="chat-messages flex h-[480px] flex-col gap-2 overflow-y-scroll scrollbar-hide lg:h-[70vh]">
                    {chats.messages.map((chatMessage) => {
                      const isSent = chatMessage.sender === localStorage.getItem("userId");
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
                <div className="theme-chat-composer relative flex justify-between gap-2 rounded-2xl sm:p-4">
                  <input className='theme-chat-input h-14 w-full rounded-4xl border p-2 sm:h-16' type="text" placeholder='Enter something...' value={message} onChange={(e) => setMessage(e.target.value)} />
                  <button className='theme-button-accent rounded-4xl px-4 py-2 shrink-0' onClick={handleMessageSend}>Send</button>
                </div>
              </div>
            ) : (
              <i>Chat will be enabled if the project is assigned to you!!</i>
            )}
          </div>
    </div>
  );
};

export default ProjectData;
