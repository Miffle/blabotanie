import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
    const navigate = useNavigate();

    const redirectToAuth = () => {
        localStorage.clear();
        navigate('/auth');
    };

    return {
        redirectToAuth
    };
}; 