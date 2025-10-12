import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';

const AllUsers = () => {

  const [users, setUsers] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;

  const fetchUsers = async() =>{
    await axios.get(`${BASE_URI}/fetch-users`).then(
      (response)=>{
          setUsers(response.data);
      }
    ).catch((err)=>{
      console.log(err);
    })
  }

  useEffect(()=>{
    fetchUsers();
  },[])




  return (
    <div className='h-[90vh] m-5 p-5 border-2 border-[#2A652E] shadow-lg rounded-lg overflow-y-scroll'>

      <h3 className='text-4xl font-bold mb-10'>All Users</h3>

      <div className="flex flex-col gap-4">

        {users.map((user)=>(

          <div className="flex gap-10 border border-[#2A652E] p-4 rounded-lg min-h-[100px] bg-green-100" key={user._id}>
              <span>
                <b>User Id</b>
                <p>{user._id}</p>
              </span>
              <span>
                <b>Username</b>
                <p>{user.username}</p>
              </span>
              <span>
                <b>Email</b>
                <p>{user.email}</p>
              </span>
              <span>
                <b>User Role</b>
                <p>{user.usertype}</p>
              </span>

          </div>

        ))}

      </div>

    </div>
  )
}

export default AllUsers