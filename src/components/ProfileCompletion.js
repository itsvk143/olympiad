'use client';
import { useState, useMemo } from 'react';
import styles from './ProfileCompletion.module.css';

// Major cities per Indian state/UT
const STATE_CITIES = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur', 'Other'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Other'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Other'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Chhapra', 'Other'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Durg', 'Korba', 'Rajnandgaon', 'Jagdalpur', 'Other'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Other'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad', 'Other'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Other'],
    'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Kangra', 'Mandi', 'Solan', 'Other'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Other'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Other'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Malappuram', 'Other'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Other'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kalyan', 'Mira-Bhayandar', 'Navi Mumbai', 'Thane', 'Kolhapur', 'Other'],
    'Manipur': ['Imphal', 'Thoubal', 'Churachandpur', 'Other'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Other'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Other'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Other'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Other'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Other'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bharatpur', 'Alwar', 'Sikar', 'Sri Ganganagar', 'Other'],
    'Sikkim': ['Gangtok', 'Namchi', 'Jorethang', 'Other'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode', 'Thoothukudi', 'Tiruppur', 'Other'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Nalgonda', 'Other'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Other'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Ghaziabad', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Mathura', 'Firozabad', 'Other'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Rishikesh', 'Haldwani', 'Nainital', 'Mussoorie', 'Other'],
    'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Baharampur', 'Kharagpur', 'Other'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Other'],
    'Chandigarh': ['Chandigarh', 'Other'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa', 'Other'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Laxmi Nagar', 'Karol Bagh', 'Preet Vihar', 'Saket', 'Other'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Other'],
    'Ladakh': ['Leh', 'Kargil', 'Other'],
    'Lakshadweep': ['Kavaratti', 'Other'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahé', 'Yanam', 'Other'],
};

const STATES = Object.keys(STATE_CITIES).sort();

export default function ProfileCompletion({ user, onComplete }) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        mobileNo: '',
        schoolName: '',
        coachingName: '',
        city: '',
        state: '',
        exam: 'OLYMPIAD',
        examPreparingFor: 'Olympiad',
        studentClass: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const availableCities = useMemo(() => {
        return formData.state ? STATE_CITIES[formData.state] || [] : [];
    }, [formData.state]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';

        if (!formData.mobileNo.trim()) {
            newErrors.mobileNo = 'Mobile number is required';
        } else if (!/^[0-9]{10}$/.test(formData.mobileNo)) {
            newErrors.mobileNo = 'Please enter a valid 10-digit mobile number';
        }

        if (!formData.exam) formData.exam = 'OLYMPIAD';
        if (!formData.studentClass) newErrors.studentClass = 'Please select your class';
        if (!formData.state) newErrors.state = 'Please select your state';
        if (!formData.city) newErrors.city = 'Please select your city';

        // schoolName and coachingName are OPTIONAL — no validation

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    exam: formData.exam,
                    examPreparingFor: formData.exam === 'JEE_MAIN' ? 'JEE MAIN' : formData.exam
                })
            });
            const data = await response.json();
            if (response.ok) {
                sessionStorage.removeItem('userProfile');
                onComplete();
            } else {
                alert(data.error || 'Failed to save profile. Please try again.');
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Reset city when state changes
        if (name === 'state') {
            setFormData(prev => ({ ...prev, state: value, city: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleExamSelect = (canonicalExam, displayLabel) => {
        setFormData(prev => ({
            ...prev,
            exam: canonicalExam,
            examPreparingFor: displayLabel
        }));
        if (errors.exam) setErrors(prev => ({ ...prev, exam: '' }));
    };

    const selectStyle = (hasError) => ({
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '10px',
        color: 'white',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box'
    });

    const EXAM_OPTIONS = [
        { id: 'OLYMPIAD', label: 'Olympiad Series', desc: 'Mathematics (IMO), Science (NSO), and English (IEO) for Classes 1 to 12' }
    ];

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Complete Your Profile</h2>
                    <p>Help us personalize your experience</p>
                    <button
                        type="button"
                        onClick={onComplete}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'
                        }}
                    >
                        Skip for now
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        {/* Full Name */}
                        <div className={styles.formGroup}>
                            <label htmlFor="name">Full Name <span className={styles.required}>*</span></label>
                            <input type="text" id="name" name="name" value={formData.name}
                                onChange={handleChange} placeholder="Enter your full name"
                                className={errors.name ? styles.inputError : ''} />
                            {errors.name && <span className={styles.error}>{errors.name}</span>}
                        </div>

                        {/* Mobile Number */}
                        <div className={styles.formGroup}>
                            <label htmlFor="mobileNo">Mobile Number <span className={styles.required}>*</span></label>
                            <input type="tel" id="mobileNo" name="mobileNo" value={formData.mobileNo}
                                onChange={handleChange} placeholder="10-digit mobile number" maxLength="10"
                                className={errors.mobileNo ? styles.inputError : ''} />
                            {errors.mobileNo && <span className={styles.error}>{errors.mobileNo}</span>}
                        </div>

                        {/* Exam Selection - Exactly ONE Exam */}
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontWeight: '700', letterSpacing: '0.5px' }}>
                                    SELECT YOUR EXAM <span className={styles.required}>*</span>
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '400' }}>
                                    (Single Exam Only: Exactly 1 Exam)
                                </span>
                            </label>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '12px'
                            }}>
                                {EXAM_OPTIONS.map(opt => {
                                    const isSelected = formData.exam === opt.id;
                                    return (
                                        <label
                                            key={opt.id}
                                            onClick={() => handleExamSelect(opt.id, opt.label)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                border: `2px solid ${isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                                                background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                <input
                                                    type="radio"
                                                    name="examSelectionRadio"
                                                    value={opt.id}
                                                    checked={isSelected}
                                                    onChange={() => handleExamSelect(opt.id, opt.label)}
                                                    style={{
                                                        accentColor: '#8b5cf6',
                                                        width: '18px',
                                                        height: '18px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                <span style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '700',
                                                    color: isSelected ? '#c4b5fd' : '#f8fafc'
                                                }}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: isSelected ? '#e2e8f0' : '#94a3b8',
                                                lineHeight: '1.3',
                                                marginLeft: '28px'
                                            }}>
                                                {opt.desc}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.exam && (
                                <span className={styles.error} style={{ marginTop: '6px', display: 'block' }}>
                                    {errors.exam}
                                </span>
                            )}
                            <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                                🔒 Your choice is locked upon enrollment. You will exclusively access tests for this exam.
                            </p>
                        </div>

                        {/* Class / Grade */}
                        <div className={styles.formGroup}>
                            <label htmlFor="studentClass">Class <span className={styles.required}>*</span></label>
                            <select id="studentClass" name="studentClass" value={formData.studentClass}
                                onChange={handleChange} style={selectStyle(!!errors.studentClass)}>
                                <option value="">Select your class</option>
                                <option value="Class 1">Class 1</option>
                                <option value="Class 2">Class 2</option>
                                <option value="Class 3">Class 3</option>
                                <option value="Class 4">Class 4</option>
                                <option value="Class 5">Class 5</option>
                                <option value="Class 6">Class 6</option>
                                <option value="Class 7">Class 7</option>
                                <option value="Class 8">Class 8</option>
                                <option value="Class 9">Class 9</option>
                                <option value="Class 10">Class 10</option>
                                <option value="Class 11">Class 11</option>
                                <option value="Class 12">Class 12</option>
                            </select>
                            {errors.studentClass && <span className={styles.error}>{errors.studentClass}</span>}
                        </div>

                        {/* School Name - OPTIONAL */}
                        <div className={styles.formGroup}>
                            <label htmlFor="schoolName">
                                School Name <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(optional)</span>
                            </label>
                            <input type="text" id="schoolName" name="schoolName" value={formData.schoolName}
                                onChange={handleChange} placeholder="Enter your school name" />
                        </div>

                        {/* Coaching Name - OPTIONAL */}
                        <div className={styles.formGroup}>
                            <label htmlFor="coachingName">
                                Coaching Name <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(optional)</span>
                            </label>
                            <input type="text" id="coachingName" name="coachingName" value={formData.coachingName}
                                onChange={handleChange} placeholder="Enter coaching institute name" />
                        </div>

                        {/* State Dropdown */}
                        <div className={styles.formGroup}>
                            <label htmlFor="state">State <span className={styles.required}>*</span></label>
                            <select id="state" name="state" value={formData.state}
                                onChange={handleChange} style={selectStyle(!!errors.state)}>
                                <option value="">Select state</option>
                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.state && <span className={styles.error}>{errors.state}</span>}
                        </div>

                        {/* City Dropdown — depends on State */}
                        <div className={styles.formGroup}>
                            <label htmlFor="city">City <span className={styles.required}>*</span></label>
                            <select id="city" name="city" value={formData.city}
                                onChange={handleChange}
                                disabled={!formData.state}
                                style={{ ...selectStyle(!!errors.city), opacity: formData.state ? 1 : 0.5 }}>
                                <option value="">{formData.state ? 'Select city' : 'Select state first'}</option>
                                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.city && <span className={styles.error}>{errors.city}</span>}
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Saving...' : 'Complete Profile'}
                    </button>

                    <p className={styles.note}>
                        <span className={styles.required}>*</span> Required fields
                    </p>
                </form>
            </div>
        </div>
    );
}
