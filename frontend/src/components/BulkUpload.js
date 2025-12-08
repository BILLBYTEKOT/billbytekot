import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '../App';

const BulkUpload = ({ type = 'menu', onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Please select a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = type === 'menu' ? '/menu/bulk-upload' : '/inventory/bulk-upload';
      const response = await axios.post(`${API}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data);
      toast.success(`${response.data.items_added} items uploaded successfully!`);
      setFile(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error('Upload failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const endpoint = type === 'menu' ? '/templates/menu-csv' : '/templates/inventory-csv';
      const response = await axios.get(`${API}${endpoint}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded!');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Upload {type === 'menu' ? 'Menu Items' : 'Inventory'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id={`csv-upload-${type}`}
          />
          <label htmlFor={`csv-upload-${type}`} className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {file ? file.name : 'Click to select CSV file'}
            </p>
          </label>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ {result.items_added} items uploaded successfully
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {result.errors.length} errors:
                </p>
                <ul className="text-sm text-red-600 mt-1 list-disc list-inside max-h-40 overflow-y-auto">
                  {result.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded">
          <p><strong>CSV Format:</strong></p>
          {type === 'menu' ? (
            <>
              <p>Columns: name, category, price, description, available</p>
              <p className="text-gray-400">Example: Margherita Pizza,Pizza,299,Classic cheese pizza,true</p>
            </>
          ) : (
            <>
              <p>Columns: item_name, quantity, unit, min_quantity, supplier</p>
              <p className="text-gray-400">Example: Tomatoes,50,kg,10,Fresh Farms</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUpload;
