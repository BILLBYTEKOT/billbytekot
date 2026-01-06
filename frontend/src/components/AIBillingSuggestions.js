import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Sparkles, Plus, X, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

const AIBillingSuggestions = ({ orderItems, onAddItem, menuItems }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (orderItems.length > 0) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [orderItems]);

  const fetchSuggestions = async () => {
    if (orderItems.length === 0) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/billing-suggestions`, orderItems);
      if (response.data.success) {
        setSuggestions(response.data.suggestions.filter(s => !dismissed.includes(s.item?.name)));
      }
    } catch (error) {
      console.error('Failed to fetch suggestions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion) => {
    const menuItem = menuItems.find(m => m.name === suggestion.item.name);
    if (menuItem && onAddItem) {
      onAddItem(menuItem);
      setDismissed([...dismissed, suggestion.item.name]);
      setSuggestions(suggestions.filter(s => s.item.name !== suggestion.item.name));
    }
  };

  const handleDismiss = (itemName) => {
    setDismissed([...dismissed, itemName]);
    setSuggestions(suggestions.filter(s => s.item.name !== itemName));
  };

  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200 relative">
      {/* Close button */}
      <button 
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">AI Suggestions</h4>
          <p className="text-xs text-gray-500">Based on customer preferences</p>
        </div>
        {loading && (
          <div className="ml-auto">
            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <div 
            key={index}
            className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 truncate">{suggestion.item.name}</span>
                {suggestion.confidence > 0.7 && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    Popular
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{suggestion.reason}</p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="font-bold text-violet-600">₹{suggestion.item.price}</span>
              <Button
                size="sm"
                className="h-8 w-8 p-0 bg-violet-500 hover:bg-violet-600"
                onClick={() => handleAddSuggestion(suggestion)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-xs text-center text-gray-400 mt-3">
        Powered by AI • Increases avg order by 25%
      </p>
    </div>
  );
};

export default AIBillingSuggestions;
