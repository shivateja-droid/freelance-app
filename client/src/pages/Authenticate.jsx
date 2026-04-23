import { useState } from 'react'
import Login from '../components/Login.jsx'
import Register from '../components/Register.jsx'
import { useNavigate } from 'react-router-dom'
import BrandTitle from '../components/BrandTitle.jsx'

const Authenticate = () => {
    const [authType, setAuthType] = useState('login'); 
    const navigate = useNavigate();

    return (
        <div className='h-full overflow-y-auto'>
            <div className='theme-hero-strip min-h-20 flex justify-between items-center gap-4 p-4 sm:p-5'>
                <button type="button" onClick={() => navigate('/')} className='cursor-pointer'>
                    <BrandTitle />
                </button>
                <button onClick={() => navigate('/')} className='theme-button-secondary px-4 py-2 font-bold'>Home</button>
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
