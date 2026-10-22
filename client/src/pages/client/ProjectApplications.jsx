import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '../../utils/notifications.js';

const ProjectApplications = () => {
  const [applications, setApplications] = useState([]);
  const [displayApplications, setDisplayApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pendingApplicationId, setPendingApplicationId] = useState(null);
  const actionLock = useRef(new Set());
  const BASE_URI = import.meta.env.VITE_API_URL;

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await axios.get(`${BASE_URI}/fetch-applications`);
      setApplications(response.data);
      setDisplayApplications([...response.data].reverse());
      return true;
    } catch (error) {
      const message = getSafeErrorMessage(error, 'Unable to load applications.');
      setLoadError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URI]);

  useEffect(() => {
    document.title = "Project Applications - KaamSetu";
    void fetchApplications();
  }, [fetchApplications]);

  const projectTitles = [...new Set(applications.map((application) => application.title))];

  const handleApprove = async (id) => {
    if (actionLock.current.has(id)) return;
    actionLock.current.add(id);
    setPendingApplicationId(id);
    try {
      await axios.get(`${BASE_URI}/approve-application/${id}`);
      if (await fetchApplications()) toast.success('Application approved.');
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Unable to approve the application.'));
    } finally {
      actionLock.current.delete(id);
      setPendingApplicationId(null);
    }
  };

  const handleReject = async (id) => {
    if (actionLock.current.has(id)) return;
    actionLock.current.add(id);
    setPendingApplicationId(id);
    try {
      await axios.get(`${BASE_URI}/reject-application/${id}`);
      if (await fetchApplications()) toast.success('Application rejected.');
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Unable to reject the application.'));
    } finally {
      actionLock.current.delete(id);
      setPendingApplicationId(null);
    }
  };

  const handleFilterChange = (value) => {
    if (value === "") {
      setDisplayApplications([...applications].reverse());
    } else {
      setDisplayApplications(applications.filter((application) => application.title === value).reverse());
    }
  };

  return (
    <div className='theme-page-shell page-scroll-frame m-3 rounded-2xl p-4 sm:m-5 sm:p-5'>
      {projectTitles.length > 0 ? (
        <div className='mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
          <h3 className='theme-heading text-lg font-bold'>Applications</h3>
          <select className='theme-select form-control w-full rounded-xl p-2 sm:w-auto' onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="">All Projects</option>
            {projectTitles.map((title) => (
              <option key={title} value={title}>{title.slice(0, 10)}{title.length > 10 ? '...' : ''}</option>
            ))}
          </select>
        </div>
      ) : ""}
      {loadError && <p className='theme-muted-text mb-4 text-center' role="alert">{loadError}</p>}
      <div className='grid min-h-[200px] grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3'>
        {isLoading && applications.length === 0 && <p className='theme-muted-text flex justify-center text-center'>Loading applications...</p>}
        {!isLoading && applications.length === 0 && <p className='theme-muted-text flex justify-center text-center'>No applications found</p>}
        {displayApplications.map((application) => (
          <div key={application._id} className='theme-card flex min-h-[150px] flex-col gap-4 overflow-auto rounded-xl p-4 scrollbar-hide xl:flex-row'>
            <div className='flex flex-1 flex-col'>
              <h3 className='theme-heading mb-3 text-lg font-bold'>{application.title.slice(0, 15)}{application.title.length > 15 ? '...' : ''}</h3>
              <p className='mb-2 wrap-break-word text-sm'>{application.description.slice(0, 100)}{application.description.length > 100 ? '...' : ''}</p>
              <p className='mb-2 text-sm'>Budget: ₹{application.budget}</p>
              <div className='mb-2 flex flex-wrap gap-2 text-sm'>Skills: {application.requiredSkills.map((skill) => (
                <span key={skill} className='theme-chip'>{skill}</span>
              ))}</div>
            </div>
            <div className="user-application-half">
              <span>
                <h5 className='font-bold'>Proposal</h5>
                <p className='wrap-break-word text-sm'>{application.proposal}</p>
              </span>
              <span>
                <h5 className='font-bold'>Skills</h5>
                <div className="mb-2 flex flex-wrap gap-2">
                  {application.freelancerSkills.map((skill) => (
                    <span key={skill} className='theme-chip'>{skill}</span>
                  ))}
                </div>
              </span>
              <h6 className='mb-2'>Proposed Budget - &#8377; <span className='font-bold'>{application.bidAmount}</span></h6>
              <div className="approve-btns">
                {application.status === 'Pending' ? (
                  <div className='flex flex-col gap-2 sm:flex-row'>
                    <button className='theme-button-primary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60' disabled={pendingApplicationId === application._id} onClick={() => handleApprove(application._id)}>{pendingApplicationId === application._id ? 'Saving...' : 'Approve'}</button>
                    <button className='theme-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60' disabled={pendingApplicationId === application._id} onClick={() => handleReject(application._id)}>Decline</button>
                  </div>
                ) : (
                  <h6>Status: <span className={`mb-2 ${application.status === 'Accepted' ? 'theme-status-complete' : 'text-red-500'}`}>{application.status}</span></h6>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectApplications;
