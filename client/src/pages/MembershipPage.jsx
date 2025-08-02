import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePatientAuth } from '../context/PatientAuthContext';
import { useCart } from '../context/CartContext';
import { Crown, Shield, Star } from 'lucide-react';

const MembershipCard = ({ level, cost, discount, icon, color, onApply, status, currentLevel, pendingUpgradeLevel }) => {
    const lowerCaseLevel = level?.toLowerCase() || '';
    const lowerCaseCurrentLevel = currentLevel?.toLowerCase() || '';
    
    const isCurrentApproved = lowerCaseLevel === lowerCaseCurrentLevel && status === 'approved';
    // An application is pending if status is pending/awaiting_payment, OR if there's a pending upgrade.
    const isPending = status === 'pending' || status === 'awaiting_payment' || !!pendingUpgradeLevel;
    
    const levelHierarchy = { 'silver': 1, 'gold': 2, 'platinum': 3 };
    const currentLevelValue = (status === 'approved' && levelHierarchy[lowerCaseCurrentLevel]) || 0;
    const cardLevelValue = levelHierarchy[lowerCaseLevel];

    const isUnlocked = currentLevelValue >= cardLevelValue;

    let buttonText = 'Apply Now';
    let isDisabled = false;

    if (isPending) {
        buttonText = 'Application Pending';
        isDisabled = true;
    } else if (isCurrentApproved) {
        buttonText = 'Current Plan';
        isDisabled = true;
    } else if (isUnlocked) {
        buttonText = 'Unlocked';
        isDisabled = true;
    }

    return (
        <div className={`border-4 ${isCurrentApproved ? color.border : 'border-transparent'} rounded-2xl p-6 shadow-xl flex flex-col text-center bg-white`}>
            <div className="mx-auto mb-4" style={{ color: color.icon }}>{icon}</div>
            <h2 className="text-3xl font-bold text-gray-900">{level}</h2>
            <p className="text-4xl font-extrabold my-4 text-gray-900">৳{cost}<span className="text-lg font-medium text-gray-500">/advanced</span></p>
            <p className="font-bold text-xl" style={{ color: color.icon }}>{discount}% Discount on all services</p>
            <button
                onClick={() => onApply(level, cost)}
                disabled={isDisabled}
                className="mt-6 w-full py-3 rounded-lg font-bold text-white transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ backgroundColor: isDisabled ? '#9ca3af' : color.icon }}
            >
                {buttonText}
            </button>
        </div>
    );
};

const MembershipPage = () => {
    const { user } = usePatientAuth();
    const { refreshDbBillCount } = useCart();
    const [membership, setMembership] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.patient?.patient_id) {
            setLoading(true);
            setError('');
            axios.get(`/api/membership/status/${user.patient.patient_id}`)
                .then(res => {
                    setMembership(res.data || { membership_level: null, membership_status: null, pending_upgrade_level: null });
                })
                .catch(err => {
                    console.error(err);
                    setError('Could not load your membership status.');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleApply = async (level, feeString) => {
        const fee = parseFloat(feeString.replace(/,/g, ''));
        if (!window.confirm(`Are you sure you want to apply for the ${level} membership? A bill of ৳${fee} will be added to your cart.`)) return;

        try {
            const description = `${level} Membership Application Fee`;
            await axios.post('/api/membership/apply', {
                patient_id: user.patient.patient_id,
                level,
                fee,
                description
            });
            alert('Application sent! Please check your cart to pay the fee.');
            refreshDbBillCount();
            // ✅ FIX: Manually update local state to provide instant UI feedback
            setMembership(prev => ({ ...prev, membership_status: 'awaiting_payment' }));
        } catch (error) {
            alert('Failed to send application. Please try again.');
        }
    };
    
    if (loading) return <div className="text-center py-20 font-semibold text-lg">Loading Membership Info...</div>;
    if (error) return <div className="text-center py-20 text-red-500 font-semibold text-lg">{error}</div>;
    if (!user) return <div className="text-center py-20 font-semibold text-lg">Please log in to view membership plans.</div>;

    const cards = [
        { level: 'Silver', cost: '10,000', discount: '10', icon: <Shield size={48} />, color: { border: 'border-gray-400', icon: '#6b7280'} },
        { level: 'Gold', cost: '25,000', discount: '20', icon: <Star size={48} />, color: { border: 'border-yellow-500', icon: '#f59e0b'} },
        { level: 'Platinum', cost: '50,000', discount: '30', icon: <Crown size={48} />, color: { border: 'border-indigo-600', icon: '#4f46e5'} },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto py-12 px-4">
                <h1 className="text-5xl font-extrabold text-center mb-10 text-gray-900">Membership Plans</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {cards.map(card => (
                        <MembershipCard
                            key={card.level}
                            {...card}
                            onApply={handleApply}
                            status={membership?.membership_status}
                            currentLevel={membership?.membership_level}
                            pendingUpgradeLevel={membership?.pending_upgrade_level}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MembershipPage;
