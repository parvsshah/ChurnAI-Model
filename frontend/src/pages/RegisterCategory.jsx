import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Database, Cpu, FileSpreadsheet, CheckCircle, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import * as api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const modelTypes = [
    { id: 'random_forest', name: 'Random Forest', description: 'Ensemble of decision trees, good for mixed feature types' },
    { id: 'gradient_boosting', name: 'Gradient Boosting', description: 'Sequential boosting, best accuracy for tabular data' },
    { id: 'logistic_regression', name: 'Logistic Regression', description: 'Linear model, fast and interpretable' },
];

const columnTypes = [
    { id: 'id', label: 'ID', description: 'Unique identifier', required: false },
    { id: 'target', label: 'Target', description: 'Churn label (0/1 or Yes/No)', required: true },
    { id: 'tenure', label: 'Tenure', description: 'Customer relationship length', required: true },
    { id: 'cost_monthly', label: 'Monthly Cost', description: 'Recurring charges', required: false },
    { id: 'cost_total', label: 'Total Cost', description: 'Cumulative charges', required: false },
    { id: 'contract', label: 'Contract', description: 'Commitment type', required: false },
    { id: 'categorical', label: 'Categorical', description: 'Service/feature categories', required: false },
    { id: 'binary', label: 'Binary', description: 'Yes/No features', required: false },
    { id: 'numeric', label: 'Numeric', description: 'Other numeric features', required: false },
];

// Semantic keyword matching — mirrors backend schema_config.py
const typeKeywords = {
    id: ['id', 'customer_id', 'customerid', 'user_id', 'userid', 'account', 'account_id'],
    target: ['churn', 'churned', 'cancelled', 'left', 'attrition', 'exit', 'target', 'label'],
    tenure: ['tenure', 'months', 'duration', 'time', 'age', 'lifetime', 'subscription_length'],
    cost_total: ['total', 'totalcharges', 'cumulative', 'lifetime_value', 'ltv', 'revenue', 'total_charges'],
    cost_monthly: ['monthly', 'monthlycharges', 'monthly_charges', 'charge', 'fee', 'price', 'cost', 'mrr', 'recurring'],
    contract: ['contract', 'plan', 'subscription', 'commitment', 'term'],
};

function inferType(colName, sampleValue) {
    const lower = colName.toLowerCase().replace(/[\s\-]/g, '_');
    // Check semantic keywords
    for (const [type, keywords] of Object.entries(typeKeywords)) {
        if (keywords.some(kw => lower.includes(kw) || lower === kw)) return type;
    }
    // Check sample value patterns
    if (sampleValue !== undefined && sampleValue !== '') {
        const val = String(sampleValue).trim().toLowerCase();
        if (['yes', 'no', 'true', 'false', '0', '1'].includes(val)) return 'binary';
        if (!isNaN(Number(val)) && val !== '') return 'numeric';
    }
    return 'categorical';
}

function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return { headers: [], firstRow: [] };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const firstRow = lines.length > 1
        ? lines[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        : headers.map(() => '');
    return { headers, firstRow };
}

export default function RegisterCategory() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const { setCategory } = useCategory();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [modelType, setModelType] = useState('random_forest');
    const [columns, setColumns] = useState([
        { name: '', type: 'id', sample: '' },
        { name: '', type: 'target', sample: '' },
        { name: '', type: 'tenure', sample: '' },
    ]);
    const [sampleFile, setSampleFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [regError, setRegError] = useState('');

    const addColumn = () => {
        setColumns(prev => [...prev, { name: '', type: 'numeric', sample: '' }]);
    };

    const removeColumn = (index) => {
        setColumns(prev => prev.filter((_, i) => i !== index));
    };

    const updateColumn = (index, field, value) => {
        setColumns(prev => prev.map((col, i) => i === index ? { ...col, [field]: value } : col));
    };

    const handleSampleFile = useCallback((file) => {
        if (!file?.name.endsWith('.csv')) return;
        setSampleFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const { headers, firstRow } = parseCSV(e.target.result);
            const newColumns = headers.map((h, i) => ({
                name: h,
                type: inferType(h, firstRow[i]),
                sample: firstRow[i] || '',
            }));
            setColumns(newColumns);
        };
        reader.readAsText(file);
    }, []);

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault(); setIsDragging(false);
        handleSampleFile(e.dataTransfer.files[0]);
    }, [handleSampleFile]);

    const handleRegister = async () => {
        setRegistering(true);
        setRegError('');
        try {
            await api.registerCategory({
                name: name.trim(),
                description,
                model_type: modelType,
                columns: columns.filter(c => c.name.trim()).map(c => ({
                    name: c.name.trim(),
                    type: c.type,
                })),
            });
            setCategory(name.trim());
            await refreshUser();
            navigate('/dashboard');
        } catch (err) {
            setRegError(err.message);
        } finally {
            setRegistering(false);
        }
    };

    const isValid = name.trim() && columns.some(c => c.type === 'target' && c.name.trim());

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4 animate-fade-in">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Register New Category</h1>
                    <p className="text-muted-foreground mt-0.5">Configure model parameters and dataset schema for a new domain</p>
                </div>
            </div>

            {/* Basic Info */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-semibold">Category Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Category Name</label>
                            <Input
                                placeholder="e.g. Telecom, SaaS, Healthcare"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-muted/30 border-border/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Description</label>
                            <Input
                                placeholder="Brief description of this domain"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-muted/30 border-border/50"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Model Configuration */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up delay-100">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-semibold">Model Configuration</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Model Type</label>
                        <Select value={modelType} onValueChange={setModelType}>
                            <SelectTrigger className="bg-muted/30 border-border/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {modelTypes.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        <div>
                                            <span className="font-medium">{m.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2">— {m.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Dataset Schema */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up delay-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-semibold">Dataset Schema</CardTitle>
                        </div>
                        <span className="text-xs text-muted-foreground">{columns.length} columns defined</span>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                    {/* Sample File Upload */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border border-dashed rounded-lg p-4 transition-all duration-200
                            ${isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-muted-foreground/40'}`}
                    >
                        {!sampleFile ? (
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0
                                    ${isDragging ? 'bg-primary/15 text-primary' : 'bg-muted/40 text-muted-foreground'}`}>
                                    <Upload className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Upload a sample CSV to auto-detect schema</p>
                                    <p className="text-xs text-muted-foreground">
                                        Column names and types will be inferred from the file headers and first data row
                                    </p>
                                </div>
                                <label>
                                    <Button variant="outline" size="sm" className="cursor-pointer text-xs shrink-0" asChild>
                                        <span>Browse</span>
                                    </Button>
                                    <input type="file" accept=".csv" className="hidden" onChange={(e) => handleSampleFile(e.target.files[0])} />
                                </label>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{sampleFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {columns.length} columns detected · {(sampleFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <Badge variant="secondary" className="text-[10px] shrink-0">Auto-detected</Badge>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                                    setSampleFile(null);
                                    setColumns([
                                        { name: '', type: 'id', sample: '' },
                                        { name: '', type: 'target', sample: '' },
                                        { name: '', type: 'tenure', sample: '' },
                                    ]);
                                }}>
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator className="opacity-20" />

                    <p className="text-xs text-muted-foreground">
                        {sampleFile
                            ? 'Columns auto-filled from your sample file. Adjust types if needed.'
                            : 'Define columns manually, or upload a sample CSV above to auto-populate.'}
                    </p>

                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/30">
                                <TableHead className="text-xs w-[200px]">Column Name</TableHead>
                                <TableHead className="text-xs w-[160px]">Type</TableHead>
                                <TableHead className="text-xs">Sample Value</TableHead>
                                <TableHead className="text-xs w-[40px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {columns.map((col, i) => (
                                <TableRow key={i} className="border-border/20">
                                    <TableCell className="py-1.5">
                                        <Input
                                            placeholder="column_name"
                                            value={col.name}
                                            onChange={(e) => updateColumn(i, 'name', e.target.value)}
                                            className="h-8 text-xs bg-muted/30 border-border/50"
                                        />
                                    </TableCell>
                                    <TableCell className="py-1.5">
                                        <Select value={col.type} onValueChange={(v) => updateColumn(i, 'type', v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/30 border-border/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {columnTypes.map((ct) => (
                                                    <SelectItem key={ct.id} value={ct.id}>
                                                        <span>{ct.label}</span>
                                                        {ct.required && <span className="text-red-400 ml-1">*</span>}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="py-1.5">
                                        <Input
                                            placeholder="e.g. 12, Yes, Monthly"
                                            value={col.sample}
                                            onChange={(e) => updateColumn(i, 'sample', e.target.value)}
                                            className="h-8 text-xs bg-muted/30 border-border/50"
                                        />
                                    </TableCell>
                                    <TableCell className="py-1.5">
                                        {columns.length > 1 && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeColumn(i)}>
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Button variant="outline" size="sm" onClick={addColumn} className="gap-1.5 text-xs">
                        <Plus className="h-3.5 w-3.5" /> Add Column
                    </Button>

                    <Separator className="opacity-30" />

                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Column Types Reference</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                            {columnTypes.map((ct) => (
                                <p key={ct.id}>
                                    <span className="font-medium">{ct.label}</span>
                                    {ct.required && <span className="text-red-400">*</span>}
                                    {' — '}{ct.description}
                                </p>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3 animate-slide-up delay-300">
                <Button
                    onClick={handleRegister}
                    disabled={!isValid}
                    className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 
                           shadow-lg shadow-primary/25 gap-2"
                >
                    <CheckCircle className="h-4 w-4" /> Register Category
                </Button>
                <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                {!isValid && (
                    <span className="text-xs text-muted-foreground">Fill in category name and at least a target column</span>
                )}
            </div>
        </div>
    );
}
