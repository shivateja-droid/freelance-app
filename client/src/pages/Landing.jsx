import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandTitle from '../components/BrandTitle'

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
        <div className='h-full overflow-y-auto'>
            <div className='theme-hero-strip min-h-20 flex justify-between items-center gap-4 p-4 sm:p-5'>
                <BrandTitle />
                <button onClick={() => navigate('/authenticate')} className='theme-button-secondary px-4 py-2 max-sm:text-sm font-bold'>Sign in</button>
            </div>
            <div className='grid grid-cols-1 gap-8 p-5 mt-8 sm:p-8 lg:grid-cols-2 lg:p-10 lg:mt-20'>
                <div className='flex flex-col justify-center items-center gap-6'>
                    <p className='theme-hero-copy text-lg text-center font-bold sm:text-2xl'>Welcome to KaamSetu, a modern freelancing platform that helps clients discover capable talent and gives freelancers a smooth path to meaningful projects.</p>
                    <button onClick={() => navigate('/authenticate')} className='theme-button-primary px-5 py-3 font-bold'>Get Started</button>
                </div>
                <img className='theme-card w-full rounded-[1.75rem] object-cover' src="src/images/home.jpg" alt="landing" />
            </div>

        </div>
    )
}

export default Landing
