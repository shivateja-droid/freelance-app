import React from 'react'
import { useEffect, useState } from 'react'
import Login from '../components/Login.jsx'
import Register from '../components/Register.jsx'
import { useNavigate } from 'react-router-dom'

const Authenticate = () => {
    const [authType, setAuthType] = useState('login'); 
    const navigate = useNavigate();

    return (
        <div>
            <div className='bg-[#61BD67] text-white h-20 flex justify-between items-center p-5 '>
                <h1 onClick={() => navigate('/')} className=' text-4xl font-bold flex justify-center items-center '>SB Works</h1>
                <button onClick={() => navigate('/')} className='bg-[#40A048] text-white font-bold py-2 px-4 rounded'>Home</button>
            </div>

            {authType === 'login' ?
                <Login setAuthType={setAuthType} />
                :
                <Register setAuthType={setAuthType} />
            }


        </div>
    )
}

export default Authenticate