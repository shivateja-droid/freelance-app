import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProjectApplications = () => {
  const [applications, setApplications] = useState([]);
  const [displayApplications, setDisplayApplications] = useState([]);
  const [projectTitles, setProjectTitles] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = "Project Applications - KaamSetu";
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    await axios
      .get(`${BASE_URI}/fetch-applications`)
      .then((response) => {
        const filtered = response.data.filter(
          (application) => application.clientId === localStorage.getItem("userId")
        );
        setApplications(filtered);
        setDisplayApplications(filtered.reverse());
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (applications.length > 0) {
      applications.forEach((application) => {
        if (!projectTitles.includes(application.title)) {
          setProjectTitles((prev) => [...prev, application.title]);
        }
      });
    }
  }, [applications]);

  useEffect(() => {
    if (projectTitles.length > 0) {
      projectTitles.filter((title) => !projectTitles.includes(title));
    }
  }, [projectTitles]);

  const handleApprove = async (id) => {
    await axios
      .get(`${BASE_URI}/approve-application/${id}`)
      .then(() => {
        alert("Application approved");
        fetchApplications();
      })
      .catch(() => {
        alert("Operation failed!!");
      });
  };

  const handleReject = async (id) => {
    await axios
      .get(`${BASE_URI}/reject-application/${id}`)
      .then(() => {
        alert("Application rejected!!");
        fetchApplications();
      })
      .catch(() => {
        alert("Operation failed!!");
      });
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
      {projectTitles ? (
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
      <div className='grid min-h-[200px] grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3'>
        {applications.length === 0 && <p className='theme-muted-text flex justify-center text-center'>No applications found</p>}
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
                    <button className='theme-button-primary px-4 py-2' onClick={() => handleApprove(application._id)}>Approve</button>
                    <button className='theme-button-secondary px-4 py-2' onClick={() => handleReject(application._id)}>Decline</button>
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
