// Mock data for the Customer Churn Prediction Dashboard

export const mockCustomers = [
    {
        id: "CUST001", name: "John Smith", email: "john.smith@email.com",
        tenure: 3, monthlyCharges: 89.5, totalCharges: 268.5, contract: "Month-to-month",
        churnProbability: 0.78, churnPrediction: "Yes", riskLevel: "critical",
        category: "Telecom",
        signals: ["High monthly charges", "Short tenure", "No contract commitment"],
        recommendations: ["Offer 12-month contract with 20% discount", "Add free premium features for 3 months", "Assign dedicated account manager"]
    },
    {
        id: "CUST002", name: "Sarah Johnson", email: "sarah.j@email.com",
        tenure: 24, monthlyCharges: 45.0, totalCharges: 1080.0, contract: "One year",
        churnProbability: 0.12, churnPrediction: "No", riskLevel: "low",
        category: "Telecom",
        signals: [], recommendations: ["Continue current engagement", "Consider loyalty rewards"]
    },
    {
        id: "CUST003", name: "Michael Chen", email: "m.chen@email.com",
        tenure: 8, monthlyCharges: 120.0, totalCharges: 960.0, contract: "Month-to-month",
        churnProbability: 0.65, churnPrediction: "Yes", riskLevel: "high",
        category: "Telecom",
        signals: ["Very high charges", "No additional services", "Recent support tickets"],
        recommendations: ["Review pricing plan options", "Proactive support outreach", "Bundle discount offer"]
    },
    {
        id: "CUST004", name: "Emily Davis", email: "emily.d@email.com",
        tenure: 36, monthlyCharges: 65.0, totalCharges: 2340.0, contract: "Two year",
        churnProbability: 0.08, churnPrediction: "No", riskLevel: "low",
        category: "SaaS/Subscription",
        signals: [], recommendations: ["Loyalty program enrollment", "Referral incentives"]
    },
    {
        id: "CUST005", name: "Robert Wilson", email: "r.wilson@email.com",
        tenure: 6, monthlyCharges: 95.0, totalCharges: 570.0, contract: "Month-to-month",
        churnProbability: 0.52, churnPrediction: "Yes", riskLevel: "high",
        category: "SaaS/Subscription",
        signals: ["Multiple service calls", "Payment delays"],
        recommendations: ["Flexible payment options", "Service quality review", "Personal follow-up call"]
    },
    {
        id: "CUST006", name: "Lisa Anderson", email: "l.anderson@email.com",
        tenure: 18, monthlyCharges: 55.0, totalCharges: 990.0, contract: "One year",
        churnProbability: 0.28, churnPrediction: "No", riskLevel: "medium",
        category: "Banking",
        signals: ["Contract expiring soon"],
        recommendations: ["Early renewal discount", "Upgrade offer"]
    },
    {
        id: "CUST007", name: "David Brown", email: "d.brown@email.com",
        tenure: 2, monthlyCharges: 110.0, totalCharges: 220.0, contract: "Month-to-month",
        churnProbability: 0.85, churnPrediction: "Yes", riskLevel: "critical",
        category: "Telecom",
        signals: ["New customer", "High charges", "No bundled services", "Competitor research"],
        recommendations: ["Immediate outreach required", "Custom pricing discussion", "Free trial of premium features"]
    },
    {
        id: "CUST008", name: "Jennifer Martinez", email: "j.martinez@email.com",
        tenure: 48, monthlyCharges: 75.0, totalCharges: 3600.0, contract: "Two year",
        churnProbability: 0.05, churnPrediction: "No", riskLevel: "low",
        category: "Banking",
        signals: [], recommendations: ["VIP customer treatment", "Exclusive offers"]
    },
    {
        id: "CUST009", name: "James Taylor", email: "j.taylor@email.com",
        tenure: 12, monthlyCharges: 85.0, totalCharges: 1020.0, contract: "One year",
        churnProbability: 0.35, churnPrediction: "No", riskLevel: "medium",
        category: "Employee",
        signals: ["Usage decline last month"],
        recommendations: ["Engagement campaign", "Feature education"]
    },
    {
        id: "CUST010", name: "Amanda White", email: "a.white@email.com",
        tenure: 4, monthlyCharges: 130.0, totalCharges: 520.0, contract: "Month-to-month",
        churnProbability: 0.72, churnPrediction: "Yes", riskLevel: "critical",
        category: "SaaS/Subscription",
        signals: ["Highest tier pricing", "Low engagement", "Support escalation"],
        recommendations: ["Executive escalation", "Custom solution review", "Immediate discount offer"]
    }
];

export const mockUploads = [
    { id: 1, name: 'customer_data_jan_2026.csv', date: '2026-02-05', time: '14:32', category: 'Telecom', rows: 2450 },
    { id: 2, name: 'churn_analysis_q4.csv', date: '2026-02-03', time: '09:15', category: 'SaaS/Subscription', rows: 1830 },
    { id: 3, name: 'bank_customers_batch.csv', date: '2026-01-28', time: '16:45', category: 'Banking', rows: 3120 },
    { id: 4, name: 'employee_retention_data.csv', date: '2026-01-22', time: '11:20', category: 'Employee', rows: 987 },
    { id: 5, name: 'telecom_q3_customers.csv', date: '2026-01-15', time: '08:30', category: 'Telecom', rows: 4205 },
    { id: 6, name: 'saas_monthly_feb.csv', date: '2026-02-01', time: '10:00', category: 'SaaS/Subscription', rows: 1520 },
    { id: 7, name: 'bank_retail_jan.csv', date: '2026-01-20', time: '13:10', category: 'Banking', rows: 2890 },
    { id: 8, name: 'hr_attrition_q4.csv', date: '2026-01-10', time: '09:45', category: 'Employee', rows: 640 },
];

export const mockDomains = [
    { id: 'telecom', name: 'Telecom', description: 'Phone and internet services', models: 2 },
    { id: 'saas', name: 'SaaS/Subscription', description: 'Software subscriptions', models: 1 },
    { id: 'bank', name: 'Banking', description: 'Financial services', models: 1 },
    { id: 'employee', name: 'Employee', description: 'HR employee retention', models: 1 }
];

// ── Per-category data factories ──

const categoryStats = {
    'Telecom': { totalCustomers: 7043, churnRate: 26.5, highRiskCount: 1865, revenueAtRisk: 245000 },
    'SaaS/Subscription': { totalCustomers: 3210, churnRate: 19.8, highRiskCount: 635, revenueAtRisk: 128000 },
    'Banking': { totalCustomers: 5480, churnRate: 14.2, highRiskCount: 778, revenueAtRisk: 189000 },
    'Employee': { totalCustomers: 1250, churnRate: 32.1, highRiskCount: 401, revenueAtRisk: 67000 },
};

const categoryTrends = {
    'Telecom': [
        { month: 'Jan', churnRate: 24.2, predictions: 1200 }, { month: 'Feb', churnRate: 25.1, predictions: 1280 },
        { month: 'Mar', churnRate: 23.8, predictions: 1150 }, { month: 'Apr', churnRate: 26.5, predictions: 1420 },
        { month: 'May', churnRate: 25.9, predictions: 1380 }, { month: 'Jun', churnRate: 26.5, predictions: 1450 },
    ],
    'SaaS/Subscription': [
        { month: 'Jan', churnRate: 18.5, predictions: 594 }, { month: 'Feb', churnRate: 19.2, predictions: 616 },
        { month: 'Mar', churnRate: 17.9, predictions: 575 }, { month: 'Apr', churnRate: 20.1, predictions: 645 },
        { month: 'May', churnRate: 19.5, predictions: 626 }, { month: 'Jun', churnRate: 19.8, predictions: 635 },
    ],
    'Banking': [
        { month: 'Jan', churnRate: 13.1, predictions: 718 }, { month: 'Feb', churnRate: 13.8, predictions: 756 },
        { month: 'Mar', churnRate: 12.9, predictions: 707 }, { month: 'Apr', churnRate: 14.5, predictions: 795 },
        { month: 'May', churnRate: 14.0, predictions: 767 }, { month: 'Jun', churnRate: 14.2, predictions: 778 },
    ],
    'Employee': [
        { month: 'Jan', churnRate: 30.5, predictions: 381 }, { month: 'Feb', churnRate: 31.2, predictions: 390 },
        { month: 'Mar', churnRate: 29.8, predictions: 373 }, { month: 'Apr', churnRate: 33.0, predictions: 413 },
        { month: 'May', churnRate: 31.8, predictions: 398 }, { month: 'Jun', churnRate: 32.1, predictions: 401 },
    ],
};

const categorySignals = {
    'Telecom': [
        { signal: 'High Monthly Charges', count: 2340, percentage: 33.2 },
        { signal: 'Month-to-Month Contract', count: 1890, percentage: 26.8 },
        { signal: 'Short Tenure (< 6 months)', count: 1456, percentage: 20.7 },
        { signal: 'No Additional Services', count: 1234, percentage: 17.5 },
        { signal: 'Recent Support Tickets', count: 987, percentage: 14.0 },
    ],
    'SaaS/Subscription': [
        { signal: 'Low Feature Adoption', count: 890, percentage: 27.7 },
        { signal: 'Declining Login Frequency', count: 756, percentage: 23.5 },
        { signal: 'No Team Expansion', count: 645, percentage: 20.1 },
        { signal: 'Support Escalations', count: 512, percentage: 15.9 },
        { signal: 'Trial-Only Usage', count: 408, percentage: 12.7 },
    ],
    'Banking': [
        { signal: 'Low Account Balance', count: 1230, percentage: 22.4 },
        { signal: 'Reduced Transactions', count: 1045, percentage: 19.1 },
        { signal: 'No Digital Banking', count: 890, percentage: 16.2 },
        { signal: 'Branch-Only Access', count: 756, percentage: 13.8 },
        { signal: 'Competitor Card Activity', count: 620, percentage: 11.3 },
    ],
    'Employee': [
        { signal: 'Low Satisfaction Score', count: 380, percentage: 30.4 },
        { signal: 'No Promotion in 2+ Years', count: 312, percentage: 25.0 },
        { signal: 'High Overtime Hours', count: 256, percentage: 20.5 },
        { signal: 'Remote Work Denied', count: 189, percentage: 15.1 },
        { signal: 'Below Market Salary', count: 145, percentage: 11.6 },
    ],
};

export function getStatsForCategory(cat) {
    return categoryStats[cat] || categoryStats['Telecom'];
}

export function getTrendForCategory(cat) {
    return categoryTrends[cat] || categoryTrends['Telecom'];
}

export function getSignalsForCategory(cat) {
    return categorySignals[cat] || categorySignals['Telecom'];
}

export function getRiskDistributionForCategory(cat) {
    const stats = getStatsForCategory(cat);
    const total = stats.totalCustomers;
    const high = stats.highRiskCount;
    const critical = Math.round(high * 0.26);
    const highOnly = high - critical;
    const medium = Math.round((total - high) * 0.30);
    const low = total - high - medium;
    return [
        { name: 'Critical', value: critical, color: '#ef4444', percentage: +((critical / total) * 100).toFixed(1) },
        { name: 'High', value: highOnly, color: '#f97316', percentage: +((highOnly / total) * 100).toFixed(1) },
        { name: 'Medium', value: medium, color: '#eab308', percentage: +((medium / total) * 100).toFixed(1) },
        { name: 'Low', value: low, color: '#10b981', percentage: +((low / total) * 100).toFixed(1) },
    ];
}

export function getCustomersForCategory(cat) {
    return mockCustomers.filter(c => c.category === cat);
}

export const mockAIInsights = [
    { icon: '🔴', title: '26.5% Overall Churn Risk', description: 'Above industry average of 22% — driven primarily by month-to-month contracts and high charges', stat: '+4.5% vs avg' },
    { icon: '💰', title: '487 Critical-Risk Customers', description: 'Representing $89,000 in monthly revenue at immediate risk of loss', stat: '$89K MRR' },
    { icon: '📋', title: 'Month-to-Month Contracts', description: 'Customers on month-to-month plans are 3.2× more likely to churn vs annual contracts', stat: '3.2× risk' },
    { icon: '📞', title: 'Support Ticket Correlation', description: 'Customers with 3+ support tickets in 30 days show 67% higher churn probability', stat: '+67%' },
    { icon: '📉', title: 'Usage Decline Pattern', description: 'Declining feature usage in the last 60 days strongly predicts churn within 90 days', stat: '82% accuracy' },
];
