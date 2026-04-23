import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Freelancer = () => {
  const navigate = useNavigate();

  const [freelancerdata, setFreelancerdata] = useState();
  const [skills, setSkills] = useState([]);
  const [description, setDescription] = useState("");
  const [freelancerId, setFreelancerId] = useState("");
  const [updateSkills, setUpdateSkills] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [applicationscount, setApplicationscount] = useState(0);
  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchUserData(localStorage.getItem('userId'));
  }, []);

  useEffect(() => {
    document.title = "Freelancer Dashboard - KaamSetu";
    fetchApplications();
  }, []);

  const fetchUserData = async (id) => {
    axios.get(`${BASE_URI}/fetch-freelancer/${id}`).then(
      (response) => {
        setFreelancerdata(response.data);
        if (response.data) {
          setFreelancerId(response.data._id);
          setSkills(response.data.skills);
          setDescription(response.data.description);
          setUpdateSkills(response.data.skills.join(', '));
          setUpdateDescription(response.data.description);
        }
      }
    );
  };

  const updateUserData = async () => {
    await axios.post(`${BASE_URI}/update-freelancer`,
      {
        freelancerId,
        updateSkills: updateSkills,
        description: updateDescription
      }).then(
        (response) => {
          setFreelancerdata(response.data);
          setSkills(response.data.skills);
          setDescription(response.data.description);
          setUpdateSkills(response.data.skills.join(', '));
          setUpdateDescription(response.data.description);
          alert("User data updated");
        }
      );
  };

  const fetchApplications = async () => {
    await axios.get(`${BASE_URI}/fetch-applications`).then(
      (response) => {
        setApplicationscount(response.data.filter((application) => application.freelancerId === localStorage.getItem('userId')));
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  return (
    <div className='theme-page-shell page-scroll-frame m-3 flex flex-col gap-5 rounded-2xl p-4 sm:m-5 sm:p-5'>
      <div className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
        <div className="theme-stat-card w-full rounded-2xl p-6">
          <h5 className="theme-heading mb-2 text-2xl font-bold tracking-tight">Current Projects : <span>{freelancerdata ? freelancerdata.currentProjects.length : 0}</span></h5>
          <p className="theme-muted-text mb-3 font-normal">Here are the current projects you are working on.</p>
          <button onClick={() => navigate('/my-projects')} className="theme-button-primary inline-flex items-center px-3 py-2 text-sm font-medium">
            View
            <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
            </svg>
          </button>
        </div>
        <div className="theme-stat-card w-full rounded-2xl p-6">
          <h5 className="theme-heading mb-2 text-2xl font-bold tracking-tight">Completed Projects : <span>{freelancerdata ? freelancerdata.completedProjects.length : 0}</span></h5>
          <p className="theme-muted-text mb-3 font-normal">Here are the completed projects you have worked on.</p>
          <button onClick={() => navigate('/my-projects')} className="theme-button-primary inline-flex items-center px-3 py-2 text-sm font-medium">
            View
            <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
            </svg>
          </button>
        </div>
        <div className="theme-stat-card w-full rounded-2xl p-6">
          <h5 className="theme-heading mb-2 text-2xl font-bold tracking-tight">Applications : <span>{applicationscount.length}</span></h5>
          <p className="theme-muted-text mb-3 font-normal">Here are the applications you have submitted.</p>
          <button onClick={() => navigate('/myApplications')} className="theme-button-primary inline-flex items-center px-3 py-2 text-sm font-medium">
            View
            <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
            </svg>
          </button>
        </div>
      </div>
      <div className='flex w-full flex-col gap-5 lg:flex-row'>
        {!isUpdating ? (
          <div className="theme-card w-full rounded-2xl p-6 lg:w-1/2">
            <div>
              My skills: {skills.length > 0 ? (
                <span className='font-bold'> {skills.join(', ')}</span>
              ) : (
                <span>No skills provided.</span>
              )}
            </div>
            <div>Description: {description || "No description provided."}</div>
            <button onClick={() => setIsUpdating(true)} className="theme-button-primary mt-4 inline-flex items-center px-3 py-2 text-sm font-medium">
              Edit Profile
            </button>
          </div>
        ) : (
          <div className='theme-card w-full rounded-2xl p-6 lg:w-1/2'>
            <div className="mb-6 w-full">
              <label htmlFor="default-input" className="theme-heading mb-2 block text-sm font-medium">Your skills</label>
              <input onChange={(e) => setUpdateSkills(e.target.value)} value={updateSkills} type="text" id="default-input" className="theme-input block w-full rounded-xl p-2.5 text-sm" />
            </div>
            <div className="mb-6 w-full">
              <label htmlFor="default-input-description" className="theme-heading mb-2 block text-sm font-medium">Your Description</label>
              <input onChange={(e) => setUpdateDescription(e.target.value)} value={updateDescription} type="text" id="default-input-description" className="theme-input block w-full rounded-xl p-2.5 text-sm" />
            </div>
            <button onClick={async () => { await updateUserData(); setIsUpdating(false); }} className="theme-button-primary mt-4 inline-flex items-center px-3 py-2 text-sm font-medium">
              Save Profile
            </button>
          </div>
        )}
        <div className='flex w-full justify-end gap-5'>
          <div className="theme-stat-card w-full rounded-2xl p-6 lg:w-1/2">
            <h5 className="theme-heading mb-2 text-2xl font-bold tracking-tight">Total funds : ₹<span>{freelancerdata ? freelancerdata.funds : "0"}</span></h5>
            <p className="theme-muted-text mb-3 font-normal">Here are the total funds you have earned.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Freelancer;
