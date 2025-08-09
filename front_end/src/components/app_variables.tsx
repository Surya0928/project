import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { General, To_Do, Paid } from '../models';

interface AppContextProps {
    id: number | null;
    setid: React.Dispatch<React.SetStateAction<number | null>>;
    username: string | null;
    setusername: React.Dispatch<React.SetStateAction<string | null>>;
    all_invoices_number: number | null;
    set_all_invoices_number: React.Dispatch<React.SetStateAction<number | null>>;
    all_invoices_data: General;  // Adjusted type to 'General'
    set_all_invoices_data: React.Dispatch<React.SetStateAction<General>>;
    pending_invoices_number: number | null;
    set_pending_invoices_number: React.Dispatch<React.SetStateAction<number | null>>;
    pending_invoices_data: General;  // Adjusted type to 'General'
    set_pending_invoices_data: React.Dispatch<React.SetStateAction<General>>;
    to_do_invoices_number: number | null;
    set_to_do_invoices_number: React.Dispatch<React.SetStateAction<number | null>>;
    to_do_invoices_data: To_Do;  // Adjusted type to 'To_Do'
    set_to_do_invoices_data: React.Dispatch<React.SetStateAction<To_Do>>;
    paid_invoices_number: number | null;
    set_paid_invoices_number: React.Dispatch<React.SetStateAction<number | null>>;
    paid_invoices_data: Paid;  // Adjusted type to 'Paid'
    set_paid_invoices_data: React.Dispatch<React.SetStateAction<Paid>>;
}

interface AppProviderProps {
    children: ReactNode;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const history = useHistory();
    const [username, setusername] = useState<string | null>(() => sessionStorage.getItem('username') || null);

    const [id, setid] = useState<number | null>(() => {
        const id = sessionStorage.getItem('id');
        return id ? parseInt(id, 10) : null;
    });

    const [all_invoices_number, set_all_invoices_number] = useState<number | null>(() => {
        const number = sessionStorage.getItem('all_invoices_number');
        return number ? parseInt(number, 10) : null;
    });

    const [all_invoices_data, set_all_invoices_data] = useState<General>(() => {
        const data = sessionStorage.getItem('all_invoices_data');
        return data ? JSON.parse(data) : {};
    });

    const [pending_invoices_number, set_pending_invoices_number] = useState<number | null>(() => {
        const number = sessionStorage.getItem('pending_invoices_number');
        return number ? parseInt(number, 10) : null;
    });

    const [pending_invoices_data, set_pending_invoices_data] = useState<General>(() => {
        const data = sessionStorage.getItem('pending_invoices_data');
        return data ? JSON.parse(data) : {};
    });

    const [to_do_invoices_number, set_to_do_invoices_number] = useState<number | null>(() => {
        const number = sessionStorage.getItem('to_do_invoices_number');
        return number ? parseInt(number, 10) : null;
    });

    const [to_do_invoices_data, set_to_do_invoices_data] = useState<To_Do>(() => {
        const data = sessionStorage.getItem('to_do_invoices_data');
        return data ? JSON.parse(data) : {};
    });

    const [paid_invoices_number, set_paid_invoices_number] = useState<number | null>(() => {
        const number = sessionStorage.getItem('paid_invoices_number');
        return number ? parseInt(number, 10) : null;
    });

    const [paid_invoices_data, set_paid_invoices_data] = useState<Paid>(() => {
        const data = sessionStorage.getItem('paid_invoices_data');
        return data ? JSON.parse(data) : {};
    });

    useEffect(() => {
        sessionStorage.setItem('id', id?.toString() || '');
        sessionStorage.setItem('username', username || '');
        sessionStorage.setItem('all_invoices_number', all_invoices_number?.toString() || '');
        sessionStorage.setItem('all_invoices_data', JSON.stringify(all_invoices_data));
        sessionStorage.setItem('pending_invoices_number', pending_invoices_number?.toString() || '');
        sessionStorage.setItem('pending_invoices_data', JSON.stringify(pending_invoices_data));
        sessionStorage.setItem('to_do_invoices_number', to_do_invoices_number?.toString() || '');
        sessionStorage.setItem('to_do_invoices_data', JSON.stringify(to_do_invoices_data));
        sessionStorage.setItem('paid_invoices_number', paid_invoices_number?.toString() || '');
        sessionStorage.setItem('paid_invoices_data', JSON.stringify(paid_invoices_data));
    }, [id, username, , all_invoices_number, all_invoices_data, pending_invoices_number, pending_invoices_data, to_do_invoices_number, to_do_invoices_data, paid_invoices_number, paid_invoices_data]);

    return (
        <AppContext.Provider
            value={{
                id,
                setid,
                username,
                setusername,
                all_invoices_number,
                set_all_invoices_number,
                all_invoices_data,
                set_all_invoices_data,
                pending_invoices_number,
                set_pending_invoices_number,
                pending_invoices_data,
                set_pending_invoices_data,
                to_do_invoices_number,
                set_to_do_invoices_number,
                to_do_invoices_data,
                set_to_do_invoices_data,
                paid_invoices_number,
                set_paid_invoices_number,
                paid_invoices_data,
                set_paid_invoices_data
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
