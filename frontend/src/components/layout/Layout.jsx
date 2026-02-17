import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar — full width, always on top, logo always visible */}
            <Navbar collapsed={collapsed} />

            <div className="flex flex-1 pt-16">
                {/* Sidebar — starts below navbar */}
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

                {/* Main content — dynamic margin reacts to sidebar */}
                <main
                    className={`flex-1 p-6 overflow-auto custom-scrollbar transition-all duration-300 ease-in-out
                        ${collapsed ? 'ml-[72px]' : 'ml-60'}`}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
