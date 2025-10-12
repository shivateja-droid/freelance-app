import React from 'react'
import { useState, useEffect } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AllApplications = () => {
  const [applications, setApplications] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchApplications = async () => {
      await axios.get(`${BASE_URI}/fetch-applications`).then(
        (response) => {
          setApplications(response.data.reverse());
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
        <p className='text-4xl font-bold mb-10'>All Applications</p>
      </div>
      <div className='flex gap-4 min-h-[200px]'>
        {applications.length === 0 && <p className='text-center flex justify-center'>No applications found</p>}
        {applications.map((application) => (
          <div key={application._id} className='flex border border-[#2A652E] p-4 rounded-lg min-h-[150px] w-1/2 bg-green-100'>
            <div className=' flex flex-col flex-1 '>
              <h3 className='text-lg font-bold mb-3'>{application.title}</h3>
              <p className='text-sm mb-2'>{application.description}</p>
              <p className='text-sm mb-2'>Budget: ₹{application.budget}</p>
              <div className='text-sm mb-2 flex gap-2'>Skills: {application.requiredSkills.map((skill) => (
                <p key={skill}>{skill}</p>
              ))}</div>
              <h5><b>Client: </b> {application.clientName}</h5>
              <h5><b>Client Id: </b> {application.clientId}</h5>
              <h5><b>Client email: </b> {application.clientEmail}</h5>
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
              <h5><b>Freelancer: </b> {application.freelancerName}</h5>
              <h5><b>Freelancer Id: </b> {application.freelancerId}</h5>
              <h5><b>Freelancer email: </b> {application.freelancerEmail}</h5>
              <h6>Status: <b style={application.status === "Accepted" ? { color: "green" } : {}} >{application.status}</b></h6>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AllApplications
