import React from 'react'
import { useState, useEffect } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
      })
    }
    fetchApplications();
  }, []);

  return (
    <div className='h-[90vh] m-5 p-5 border-2 border-[#2A652E] shadow-lg rounded-lg overflow-y-scroll'>
      <div>
        <p className='text-4xl font-bold mb-10'>My Applications</p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]'>
        {applications.length === 0 && <p className='text-center flex justify-center'>No applications found</p>}
        {applications.filter((application) => application.freelancerId === localStorage.getItem('userId')).map((application) => (
          <div key={application._id} className='flex border border-[#2A652E] p-4 rounded-lg min-h-[150px] hover:cursor-pointer hover:shadow-lg bg-green-100'>
            <div className=' flex flex-col flex-1 '>
              <h3 className='text-lg font-bold mb-3'>{application.title}</h3>
              <p className='text-sm mb-2'>{application.description}</p>
              <p className='text-sm mb-2'><b>Budget:</b> ₹{application.budget}</p>
              <p className='text-sm mb-2'><b>Skills:</b> {application.requiredSkills.map((skill) => (
                <p key={skill}>{skill}</p>
              ))}</p>
              <p className='text-sm mb-2'>
                <b>Status:</b><span className={`text-sm ${application.status === "Available" ? "text-green-500" : application.status === "In Progress" ? "text-yellow-500" : "text-red-500"}`}> {application.status}</span>
              </p>
            </div>
            <div className="user-application-half">
              <span>
                <h5 className='font-bold'>Proposal</h5>
                <p>{application.proposal}</p>
              </span>
              <span>
                <h5 className='font-bold'>Skills</h5>
                <div className="application-skills">
                  {application.freelancerSkills.map((skill) => (
                    <p key={skill} >{skill}</p>
                  ))}
                </div>
              </span>
              <h6>Proposed Budget - &#8377; {application.bidAmount}</h6>
              <h6>Status: <b>{application.status}</b></h6>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyApplications
