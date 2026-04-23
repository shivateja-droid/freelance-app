import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchApplications = async () => {
      await axios.get(`${BASE_URI}/fetch-applications`).then(
        (response) => {
          setApplications(response.data);
        }
      ).catch((err) => {
        console.log(err);
        fetchApplications();
      });
    };
    document.title = "My Applications - KaamSetu";
    fetchApplications();
  }, []);

  return (
    <div className='theme-page-shell page-scroll-frame m-3 rounded-2xl p-4 sm:m-5 sm:p-5'>
      <div>
        <p className='theme-heading mb-8 text-3xl font-bold sm:mb-10 sm:text-4xl'>My Applications</p>
      </div>
      <div className='grid min-h-[200px] grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3'>
        {applications.length === 0 && <p className='theme-muted-text flex justify-center text-center'>No applications found</p>}
        {applications.filter((application) => application.freelancerId === localStorage.getItem('userId')).map((application) => (
          <div key={application._id} className='theme-card flex min-h-[150px] cursor-pointer flex-col justify-between gap-4 overflow-auto rounded-xl p-4 scrollbar-hide xl:flex-row'>
            <div className='flex flex-1 flex-col'>
              <h3 className='mb-3 text-lg font-bold'>{application.title.slice(0, 10)}...</h3>
              <p className='mb-2 wrap-break-word text-sm'>{application.description.slice(0, 100)}...</p>
              <p className='mb-2 text-sm'><b>Budget:</b> ₹{application.budget}</p>
              <p className='mb-2 text-sm'><b>Skills:</b> {application.requiredSkills.map((skill) => (
                <span key={skill} className='theme-chip ml-2'>{skill}</span>
              ))}</p>
              <p className='mb-2 text-sm'>
                <b>Status:</b><span className={`text-sm ${application.status === "Accepted" ? "text-green-500" : application.status === "Assigned" ? "text-yellow-500" : application.status === "Pending" ? "text-orange-500" : "text-red-500"}`}> {application.status}</span>
              </p>
            </div>
            <div className="user-application-half">
              <span>
                <h5 className='font-bold'>Proposal</h5>
                <p>{application.proposal}</p>
              </span>
              <span>
                <h5 className='font-bold'>Skills</h5>
                <div className="application-skills flex flex-wrap gap-2">
                  {application.freelancerSkills.map((skill) => (
                    <span key={skill} className='theme-chip'>{skill}</span>
                  ))}
                </div>
              </span>
              <h6>Proposed Budget - &#8377; {application.bidAmount}</h6>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyApplications;
