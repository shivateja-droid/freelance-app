import React from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Landing = () => {
    const navigate = useNavigate()
    useEffect(() => {
        if (localStorage.getItem('usertype') === 'client') {
            navigate('/client')
        } else if (localStorage.getItem('usertype') === 'freelancer') {
            navigate('/freelancer')
        } else if (localStorage.getItem('usertype') === 'admin') {
            navigate('/admin')
        }
    }, [navigate])
    return (
        <div>
            <div className='bg-[#7CCB82] text-white h-20 flex justify-between items-center p-5 '>
                <h1 className=' text-4xl font-bold flex justify-center items-center '>SB Works</h1>
                <button onClick={() => navigate('/authenticate')} className='bg-[#40A048] text-white font-bold py-2 px-4 rounded'>Sign in</button>
            </div>
            <div className='grid grid-cols-2 gap-4 p-10 mt-20'>
                <div className='flex flex-col justify-center items-center'>
                    <p className='text-green-400 text-2xl text-center font-bold flex justify-center items-center h-full'>Welcome to SB Works, a revolutionary freelancing platform that transforms the way clients connect with skilled freelancers. Our intuitive interface provides clients with the opportunity to post diverse projects, ranging from creative endeavours to technical tasks, while freelancers can seamlessly bid on these projects based on their expertise and capabilities.</p>
                    <button onClick={() => navigate('/authenticate')} className='bg-[#40A048] text-white font-bold py-2 px-4 rounded'>Get Started</button>
                </div>
                <img className='rounded-2xl' src="src/images/home.jpg" alt="landing" />
            </div>

        </div>
    )
}

export default Landing