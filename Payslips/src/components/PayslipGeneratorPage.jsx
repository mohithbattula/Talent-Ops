import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../supabaseClient';
import {
    generatePayslipNumber,
    calculatePresentDays,
    calculateLeaveDays,
    formatMonth
} from '../utils/payslipHelpers';
import { generatePayslipPDF, uploadPayslipPDF } from '../utils/pdfGenerator';
import { Upload, Download, FileText, Share2 } from 'lucide-react';
import './PayslipGeneratorPage.css';

const PayslipGeneratorPage = () => {
    const [employees, setEmployees] = useState([]);
    const [companySettings, setCompanySettings] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');

    // Form state
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [payslipNumber, setPayslipNumber] = useState('');

    // Company details
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');

    // Payslip data
    const [employeeData, setEmployeeData] = useState(null);
    const [payrollData, setPayrollData] = useState(null);
    const [presentDays, setPresentDays] = useState(0);
    const [leaveDays, setLeaveDays] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchEmployees();
        fetchCompanySettings();
        generateNewPayslipNumber();
    }, []);

    useEffect(() => {
        if (selectedEmployee && selectedMonth) {
            fetchEmployeeData();
        }
    }, [selectedEmployee, selectedMonth, selectedYear]);

    const fetchEmployees = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .order('full_name');

        if (!error && data) {
            setEmployees(data);
        }
    };

    const fetchCompanySettings = async () => {
        const { data, error } = await supabase
            .from('company_settings')
            .select('*')
            .limit(1)
            .single();

        if (!error && data) {
            setCompanySettings(data);
            setCompanyName(data.company_name || '');
            setCompanyAddress(data.company_address || '');
            setCompanyEmail(data.company_email || '');
            setCompanyPhone(data.company_phone || '');
            setLogoPreview(data.logo_url || '');
        }
    };

    const generateNewPayslipNumber = async () => {
        const number = await generatePayslipNumber();
        setPayslipNumber(number);
    };

    const fetchEmployeeData = async () => {
        setLoading(true);
        setError('');

        try {
            // Fetch employee details
            const { data: employee, error: empError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', selectedEmployee)
                .single();

            if (empError) throw empError;
            setEmployeeData(employee);

            // Fetch payroll data
            const monthStr = formatMonth(parseInt(selectedMonth), selectedYear);
            const { data: payroll, error: payrollError } = await supabase
                .from('payroll')
                .select('*')
                .eq('employee_id', selectedEmployee)
                .eq('month', monthStr)
                .single();

            if (payrollError) {
                setError('No payroll data found for this employee and month');
                setPayrollData(null);
            } else {
                setPayrollData(payroll);
            }

            // Calculate attendance
            const present = await calculatePresentDays(selectedEmployee, parseInt(selectedMonth), selectedYear);
            const leaves = await calculateLeaveDays(selectedEmployee, parseInt(selectedMonth), selectedYear);

            setPresentDays(present);
            setLeaveDays(leaves);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to fetch employee data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Logo file size must be less than 5MB');
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const uploadLogo = async () => {
        if (!logoFile) return logoPreview;

        const fileExt = logoFile.name.split('.').pop();
        const fileName = `company-logo-${Date.now()}.${fileExt}`;

        // Use admin client to bypass RLS
        const { data, error } = await supabaseAdmin.storage
            .from('PAYSLIPS')
            .upload(fileName, logoFile, {
                contentType: logoFile.type,
                upsert: true
            });

        if (error) throw error;

        const { data: urlData } = supabaseAdmin.storage
            .from('PAYSLIPS')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    };

    const handleGeneratePayslip = async () => {
        if (!selectedEmployee || !selectedMonth || !payrollData) {
            setError('Please select employee, month and ensure payroll data exists');
            return;
        }

        if (!companyName) {
            setError('Please enter company name');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Upload logo if changed
            let logoUrl = logoPreview;
            if (logoFile) {
                logoUrl = await uploadLogo();
            }

            // Save/update company settings
            const settingsData = {
                company_name: companyName,
                company_address: companyAddress,
                company_email: companyEmail,
                company_phone: companyPhone,
                logo_url: logoUrl
            };

            if (companySettings?.id) {
                await supabase
                    .from('company_settings')
                    .update(settingsData)
                    .eq('id', companySettings.id);
            } else {
                await supabase
                    .from('company_settings')
                    .insert(settingsData);
            }

            // Prepare payslip data
            const monthStr = formatMonth(parseInt(selectedMonth), selectedYear);
            const payslipData = {
                payslipNumber,
                employeeId: selectedEmployee,
                employeeName: employeeData.full_name,
                employeeEmail: employeeData.email,
                employeeRole: employeeData.role,
                employeeLocation: employeeData.location,
                month: monthStr,
                basicSalary: payrollData.basic_salary || 0,
                hra: payrollData.hra || 0,
                allowances: payrollData.allowances || 0,
                deductions: payrollData.deductions || 0,
                lopDays: payrollData.lop_days || 0,
                lopAmount: 0,
                netSalary: payrollData.net_salary || 0,
                presentDays,
                leaveDays
            };

            // Generate PDF
            const pdf = await generatePayslipPDF(payslipData, settingsData);

            // Upload to Supabase
            const storageUrl = await uploadPayslipPDF(pdf, payslipNumber, selectedEmployee);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            // Save payslip record
            const { error: insertError } = await supabase
                .from('payslips')
                .insert({
                    payslip_number: payslipNumber,
                    employee_id: selectedEmployee,
                    month: monthStr,
                    amount: payrollData.net_salary,
                    storage_url: storageUrl,
                    created_by: user?.id,
                    status: 'generated'
                });

            if (insertError) throw insertError;

            setSuccess('Payslip generated successfully!');

            // Generate new payslip number for next one
            await generateNewPayslipNumber();

            // Reset form
            setTimeout(() => {
                setSelectedEmployee('');
                setSelectedMonth('');
                setEmployeeData(null);
                setPayrollData(null);
                setPresentDays(0);
                setLeaveDays(0);
                setSuccess('');
            }, 2000);
        } catch (err) {
            console.error('Error generating payslip:', err);
            setError(err.message || 'Failed to generate payslip');
        } finally {
            setLoading(false);
        }
    };

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const years = Array.from({ length: 11 }, (_, i) => 2030 - i); // 2030 down to 2020

    const totalEarnings = payrollData
        ? (payrollData.basic_salary || 0) + (payrollData.hra || 0) + (payrollData.allowances || 0)
        : 0;

    const totalDeductions = payrollData
        ? (payrollData.deductions || 0)
        : 0;

    return (
        <div className="payslip-generator-page">
            {/* Header */}
            <div className="page-header">
                <h1>Payslip Generator</h1>
                <div className="header-actions">
                    <button className="btn btn-secondary">
                        <Download size={18} />
                        Download PDF
                    </button>
                    <button className="btn btn-secondary">
                        Export PDF
                    </button>
                    <button className="btn btn-primary">
                        <Share2 size={18} />
                        Share
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Main Content */}
            <div className="page-content">
                {/* Left Column - Company & Employee Details */}
                <div className="form-column">
                    {/* Logo Upload */}
                    <div className="logo-upload-section">
                        <div className="logo-preview-box">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Company Logo" />
                            ) : (
                                <Upload size={32} color="#999" />
                            )}
                        </div>
                        <div className="upload-info">
                            <label className="upload-label">
                                Click to Upload Logo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <p className="upload-hint">PNG, JPG, GIF (Max 5MB)</p>
                        </div>
                    </div>

                    {/* Company Details */}
                    <div className="form-section">
                        <input
                            type="text"
                            placeholder="Company Name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="form-input"
                        />
                        <textarea
                            placeholder="Company Address"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            className="form-input"
                            rows="3"
                        />
                        <input
                            type="email"
                            placeholder="Company Email"
                            value={companyEmail}
                            onChange={(e) => setCompanyEmail(e.target.value)}
                            className="form-input"
                        />
                        <input
                            type="tel"
                            placeholder="Company Phone"
                            value={companyPhone}
                            onChange={(e) => setCompanyPhone(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* Employee Selection */}
                    <div className="form-section">
                        <h3>Employee Details</h3>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="form-input"
                        >
                            <option value="">-- Select Employee --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.full_name} ({emp.email})
                                </option>
                            ))}
                        </select>

                        {employeeData && (
                            <div className="employee-info">
                                <p><strong>Role:</strong> {employeeData.role}</p>
                                <p><strong>Location:</strong> {employeeData.location || 'N/A'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Payslip Details */}
                <div className="form-column">
                    {/* Payslip Info */}
                    <div className="form-section">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Payslip #</label>
                                <input
                                    type="text"
                                    value={payslipNumber}
                                    readOnly
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">Select month...</option>
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="form-input"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Currency</label>
                                <input
                                    type="text"
                                    value="INR (₹)"
                                    readOnly
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attendance Summary */}
                    {payrollData && (
                        <div className="form-section">
                            <h3>Attendance Summary</h3>
                            <div className="attendance-grid">
                                <div className="attendance-card">
                                    <span className="label">Present Days</span>
                                    <span className="value">{presentDays}</span>
                                </div>
                                <div className="attendance-card">
                                    <span className="label">Leave Days</span>
                                    <span className="value">{leaveDays}</span>
                                </div>
                                <div className="attendance-card">
                                    <span className="label">LOP Days</span>
                                    <span className="value">{payrollData.lop_days || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Salary Breakdown */}
                    {payrollData && (
                        <div className="form-section">
                            <h3>Salary Breakdown</h3>

                            <div className="salary-section">
                                <h4>Earnings</h4>
                                <div className="salary-row">
                                    <span>Basic Salary</span>
                                    <span>₹{(payrollData.basic_salary || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span>HRA</span>
                                    <span>₹{(payrollData.hra || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row">
                                    <span>Allowances</span>
                                    <span>₹{(payrollData.allowances || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row total">
                                    <span>Total Earnings</span>
                                    <span>₹{totalEarnings.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="salary-section">
                                <h4>Deductions</h4>
                                <div className="salary-row">
                                    <span>Deductions</span>
                                    <span>₹{(payrollData.deductions || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="salary-row total">
                                    <span>Total Deductions</span>
                                    <span>₹{totalDeductions.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="net-salary-box">
                                <span>Net Salary</span>
                                <span>₹{(payrollData.net_salary || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Generate Button */}
            <div className="page-footer">
                <button
                    className="btn btn-generate"
                    onClick={handleGeneratePayslip}
                    disabled={loading || !selectedEmployee || !selectedMonth || !payrollData}
                >
                    <FileText size={20} />
                    {loading ? 'Generating...' : 'Generate Payslip'}
                </button>
            </div>
        </div>
    );
};

export default PayslipGeneratorPage;
