import React, { useState, useEffect } from 'react'
import axios from 'axios';


const ProjectApplications = () => {
  const [applications, setApplications] = useState([]);
  const [displayApplications, setDisplayApplications] = useState([]);
  const [projectTitles, setProjectTitles] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    await axios
      .get(`${BASE_URI}/fetch-applications`)
      .then((response) => {
        setApplications(
          response.data.filter(
            (application) =>
              application.clientId === localStorage.getItem("userId")
          )
        );
        setDisplayApplications(
          response.data
            .filter(
              (application) =>
                application.clientId === localStorage.getItem("userId")
            )
            .reverse()
        );
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
      .then((response) => {
        alert("Application approved");
        fetchApplications();
      })
      .catch((err) => {
        alert("Operation failed!!");
      });
  };

  const handleReject = async (id) => {
    await axios
      .get(`${BASE_URI}/reject-application/${id}`)
      .then((response) => {
        alert("Application rejected!!");
        fetchApplications();
      })
      .catch((err) => {
        alert("Operation failed!!");
      });
  };

  const handleFilterChange = (value) => {
    if (value === "") {
      setDisplayApplications([...applications].reverse());
    } else {
      setDisplayApplications(
        applications.filter((application) => application.title === value).reverse()
      );
    }
  };

  return (
    <div className='h-[90vh] m-5 p-5 border-2 border-[#2A652E] shadow-lg rounded-lg overflow-y-scroll'>
      {projectTitles ?
        <div className='flex justify-between items-center mb-5'>
          <h3 className='text-lg font-bold'>Applications</h3>
          <select className='form-control' onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="">All Projects</option>
            {projectTitles.map((title) => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>
        : ""}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]'>
        {applications.length === 0 && <p className='text-center flex justify-center'>No applications found</p>}
        {displayApplications.map((application) => (
          <div key={application._id} className='flex border border-[#2A652E] p-4 rounded-lg min-h-[150px]'>
            <div className=' flex flex-col flex-1'>
              <h3 className='text-lg font-bold mb-3 text-[#2A652E]'>{application.title}</h3>
              <p className='text-sm mb-2'>{application.description}</p>
              <p className='text-sm mb-2'>Budget: ₹{application.budget}</p>
              <div className='text-sm mb-2 flex gap-1'>Skills: {application.requiredSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}</div>
            </div>
            <div className="user-application-half">
              <span>
                <h5 className='font-bold'>Proposal</h5>
                <p>{application.proposal}</p>
              </span>
              <span>
                <h5 className='font-bold'>Skills</h5>
                <div className="flex gap-1 mb-2">
                  {application.freelancerSkills.map((skill) => (
                    <p key={skill} >{skill}</p>
                  ))}
                </div>
              </span>
              <h6 className='mb-2'>Proposed Budget - &#8377; <span className='font-bold'>{application.bidAmount}</span></h6>
              <div className="approve-btns">
                {application.status === 'Pending' ?
                  <div className='flex gap-2'>
                    <button className='bg-green-500 text-white px-4 py-2 rounded-lg' onClick={() => handleApprove(application._id)} >Approve</button>
                    <button className='bg-red-500 text-white px-4 py-2 rounded-lg' onClick={() => handleReject(application._id)} >Decline</button>
                  </div>
                  :
                  <h6 >Status: <b className={`mb-2 ${application.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>{application.status}</b></h6>
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectApplications