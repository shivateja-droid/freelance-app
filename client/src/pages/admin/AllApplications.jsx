import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AllApplications = () => {
  const [applications, setApplications] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = "All Applications - KaamSetu";
    const fetchApplications = async () => {
      await axios.get(`${BASE_URI}/fetch-applications`).then(
        (response) => {
          setApplications(response.data.reverse());
        }
      ).catch((err) => {
        console.log(err);
        fetchApplications();
      });
    };
    fetchApplications();
  }, []);

  return (
    <div className='theme-page-shell page-scroll-frame m-3 rounded-2xl p-4 sm:m-5 sm:p-5'>
      <div>
        <p className='theme-heading mb-8 text-3xl font-bold sm:mb-10'>All Applications</p>
      </div>
      <div className='grid min-h-[200px] grid-cols-1 gap-4 overflow-auto scrollbar-hide xl:grid-cols-2'>
        {applications.length === 0 && <p className='theme-muted-text flex justify-center text-center'>No applications found</p>}
        {applications.map((application) => (
          <div key={application._id} className='theme-card flex min-h-[150px] w-full flex-col gap-4 overflow-auto rounded-xl p-4 scrollbar-hide lg:flex-row'>
            <div className='flex flex-col'>
              <h3 className='mb-3 text-lg font-bold'>{application.title}</h3>
              <p className='mb-2 text-sm'>{application.description}</p>
              <p className='mb-2 text-sm'>Budget: ₹{application.budget}</p>
              <div className='mb-2 flex flex-wrap gap-2 text-sm'>Skills: {application.requiredSkills.map((skill) => (
                <span key={skill} className='theme-chip'>{skill}</span>
              ))}</div>
              <h5><b>Client: </b> {application.clientName}</h5>
              <h5><b>Client Id: </b> {application.clientId}</h5>
              <h5><b>Client email: </b> {application.clientEmail}</h5>
            </div>
            <div className="theme-panel-divider user-application-half flex flex-col gap-2 border-t pt-3 lg:border-l lg:border-t-0 lg:pl-4">
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
              <h5><b>Freelancer: </b> {application.freelancerName}</h5>
              <h5><b>Freelancer Id: </b> {application.freelancerId}</h5>
              <h5><b>Freelancer email: </b> {application.freelancerEmail}</h5>
              <h6>Status: <b className={application.status === "Accepted" ? "theme-status-complete" : ""}>{application.status}</b></h6>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllApplications;
