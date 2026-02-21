import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Icon } from '@iconify/react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    addToast,
    Progress,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from '@heroui/react';
import { gradeRuleService } from '@/services';

const TEMPLATE_HEADERS = ['Grade Name', 'Min Percentage', 'Max Percentage', 'Description'];

const BulkGradeRuleModal = ({ isOpen, onOpenChange, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `grade_rules_template.xlsx`);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const processFile = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Remove empty rows and header
                const rows = jsonData.filter(row => row.length > 0 && row.some(cell => cell !== undefined && cell !== ''));

                if (rows.length <= 1) {
                    throw new Error('Template is empty or missing data rows.');
                }

                const headers = rows[0];
                const dataRows = rows.slice(1);

                // Validate basic headers
                const missingHeaders = TEMPLATE_HEADERS.filter(h => !headers.includes(h));
                if (missingHeaders.length > 0) {
                    throw new Error(`Missing expected columns: ${missingHeaders.join(', ')}`);
                }

                const payload = dataRows.map((row, index) => {
                    const rowObj = {};
                    headers.forEach((header, i) => {
                        rowObj[header] = row[i];
                    });

                    // map to dto
                    return {
                        grade: String(rowObj['Grade Name'] || '').trim(),
                        minPercentage: parseFloat(rowObj['Min Percentage']),
                        maxPercentage: parseFloat(rowObj['Max Percentage']),
                        description: String(rowObj['Description'] || '').trim() || undefined
                    };
                });

                // Basic payload validation
                const validPayload = payload.filter(p => p.grade && !isNaN(p.minPercentage) && !isNaN(p.maxPercentage));

                if (validPayload.length === 0) {
                    throw new Error('No valid rows found to upload. Please check your data format.');
                }

                const response = await gradeRuleService.bulkCreateGradeRules(validPayload);

                if (response.data?.success) {
                    addToast({
                        title: 'Grade rules bulk created successfully',
                        color: 'success'
                    });
                    setResult({ success: true, count: validPayload.length });
                    onSuccess();
                } else {
                    throw new Error(response.data?.message || 'Failed to bulk create grade rules');
                }
            } catch (error) {
                console.error('Bulk upload error:', error);
                setResult({
                    success: false,
                    error: error.message || (error.response?.data?.message) || 'An error occurred during processing'
                });
            } finally {
                setUploading(false);
            }
        };

        reader.onerror = () => {
            setUploading(false);
            setResult({ success: false, error: 'Failed to read file.' });
        };

        reader.readAsArrayBuffer(file);
    };

    const handleModalClose = (onClose) => {
        setFile(null);
        setResult(null);
        setUploading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" placement="top-center">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Bulk Create Grade Rules</ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">

                                {/* Step 1 */}
                                <div className="bg-default-50 border border-default-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Icon icon="mdi:file-excel-box" className="text-3xl text-success" />
                                        <div>
                                            <p className="font-medium">1. Download Template</p>
                                            <p className="text-xs text-default-500">Ensure your data matches the format</p>
                                        </div>
                                    </div>
                                    <Button
                                        color="success"
                                        variant="flat"
                                        startContent={<Icon icon="mdi:download" />}
                                        onPress={handleDownloadTemplate}
                                        size="sm"
                                    >
                                        Download Template
                                    </Button>
                                </div>

                                {/* Step 2 */}
                                <div className="bg-content1">
                                    <p className="font-medium mb-2">2. Upload Filled Template</p>
                                    <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-default-300 hover:border-primary hover:bg-default-50'}`}>
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="grade-rule-upload"
                                        />
                                        <label
                                            htmlFor="grade-rule-upload"
                                            className="flex flex-col items-center cursor-pointer w-full"
                                        >
                                            {file ? (
                                                <>
                                                    <Icon icon="mdi:file-check" className="text-4xl text-primary mb-2" />
                                                    <p className="font-semibold">{file.name}</p>
                                                    <p className="text-sm text-default-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                                    <Button size="sm" color="primary" variant="flat" className="mt-4 pointer-events-none">
                                                        Change File
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Icon icon="mdi:cloud-upload" className="text-4xl text-default-300 mb-2" />
                                                    <p className="font-semibold text-center">Click to upload or drag and drop</p>
                                                    <p className="text-sm text-default-500 mt-1 text-center">Excel files only (.xlsx, .xls)</p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {uploading && (
                                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                                        <Progress size="sm" isIndeterminate color="primary" className="max-w-md" />
                                        <p className="text-sm text-default-500">Processing file and uploading...</p>
                                    </div>
                                )}

                                {result && (
                                    <div className={`p-4 rounded-lg mt-4 flex items-start gap-3 ${result.success ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                                        <Icon icon={result.success ? "mdi:check-circle" : "mdi:alert-circle"} className="text-xl mt-0.5 shrink-0" />
                                        <div>
                                            {result.success ? (
                                                <p className="font-medium">Successfully processed and uploaded {result.count} grade rules!</p>
                                            ) : (
                                                <div>
                                                    <p className="font-medium">Upload Failed</p>
                                                    <p className="text-sm mt-1">{result.error}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="flat" onPress={() => handleModalClose(onClose)} isDisabled={uploading}>
                                {result?.success ? 'Close' : 'Cancel'}
                            </Button>
                            {!result?.success && (
                                <Button color="primary" onPress={processFile} isDisabled={!file || uploading} isLoading={uploading}>
                                    Upload & Process
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default BulkGradeRuleModal;
