import { useState } from 'react';
import Layout from '../components/Layout';
import AIInsightsPanel from '../components/AIInsightsPanel';
import { Sparkles, Brain, TrendingUp, Target } from 'lucide-react';

const AIAnalyticsPage = ({ user }) => {
  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Analytics Center</h1>
                <p className="text-white/80">Powered by GPT-4 • Real-time insights</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <Sparkles className="w-6 h-6 mb-2" />
                <div className="text-sm text-white/70">Smart Insights</div>
                <div className="font-bold">AI-Powered</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <TrendingUp className="w-6 h-6 mb-2" />
                <div className="text-sm text-white/70">Revenue Boost</div>
                <div className="font-bold">+25% Avg</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <Target className="w-6 h-6 mb-2" />
                <div className="text-sm text-white/70">Accuracy</div>
                <div className="font-bold">95%+</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <Brain className="w-6 h-6 mb-2" />
                <div className="text-sm text-white/70">Model</div>
                <div className="font-bold">GPT-4</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Panel - Full */}
        <AIInsightsPanel compact={false} />
      </div>
    </Layout>
  );
};

export default AIAnalyticsPage;
