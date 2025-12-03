
import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Activity, 
  Brain, 
  Zap, 
  Heart, 
  ShieldCheck, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { AssessmentData } from '../types';

interface ReportDisplayProps {
  data: AssessmentData;
  onContinueToCounseling: () => void;
  counselingAgentName: string;
  isAdmin?: boolean;
  onBackToDashboard?: () => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ 
  data, 
  onContinueToCounseling, 
  counselingAgentName,
  isAdmin,
  onBackToDashboard
}) => {
  const isHighRisk = data.riskLevel === 'high';
  const isMediumRisk = data.riskLevel === 'medium';

  const riskColor = isHighRisk 
    ? 'text-red-600 bg-red-50 border-red-200' 
    : isMediumRisk 
      ? 'text-yellow-600 bg-yellow-50 border-yellow-200' 
      : 'text-green-600 bg-green-50 border-green-200';

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Admin Navigation */}
        {isAdmin && onBackToDashboard && (
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">返回指挥中心</span>
          </button>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <ShieldCheck className="text-blue-600 w-8 h-8" />
                警务人员心理健康综合评估
              </h1>
              <p className="text-slate-500 mt-2 text-sm">生成时间: {new Date(data.lastUpdated).toLocaleString()}</p>
            </div>
            
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold ${riskColor}`}>
              {isHighRisk ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
              <span className="uppercase tracking-wide">
                {isHighRisk ? '高风险预警' : isMediumRisk ? '中度关注' : '状态良好'}
              </span>
            </div>
          </div>

          <div className="mt-6 bg-slate-50 p-5 rounded-xl border border-slate-100 text-slate-700 leading-relaxed italic border-l-4 border-l-blue-500">
            “{data.summary}”
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Psychological Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Brain className="text-indigo-500" size={20} />
              心理状态分析
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">情绪稳定性</span>
                <p className="text-slate-700 mt-1 text-sm">{data.psychologicalStatus.emotionalStability}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">职业倦怠</span>
                <p className="text-slate-700 mt-1 text-sm">{data.psychologicalStatus.burnoutLevel}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">社会支持系统</span>
                <p className="text-slate-700 mt-1 text-sm">{data.psychologicalStatus.socialSupport}</p>
              </div>
            </div>
          </div>

          {/* Stress Sources */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Zap className="text-amber-500" size={20} />
              主要压力源识别
            </h3>

            {/* Severity Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
               <span className="font-semibold text-slate-700">严重等级说明 (1-10)：</span>
               <div className="flex items-center gap-1.5">
                 <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                 <span>1-4 轻度 (日常调整)</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                 <span>5-7 中度 (需重点关注)</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                 <span>8-10 重度 (建议专业干预)</span>
               </div>
            </div>

            <div className="space-y-3">
              {data.stressSources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                    ${source.severity >= 8 ? 'bg-red-100 text-red-600' : source.severity >= 5 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}
                  `}>
                    {source.severity}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700 text-sm">{source.category}</div>
                    <div className="text-xs text-slate-500">{source.description}</div>
                  </div>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${source.severity >= 8 ? 'bg-red-500' : source.severity >= 5 ? 'bg-orange-500' : 'bg-blue-500'}`} 
                      style={{ width: `${source.severity * 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {data.stressSources.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">未检测到显著压力源</p>
              )}
            </div>
          </div>
        </div>

        {/* Risk Analysis (if elevated) */}
        {(isHighRisk || isMediumRisk) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-red-500">
            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-2">
              <Activity className="text-red-600" size={20} />
              风险预警详细分析
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm">
              {data.riskAnalysis}
            </p>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Heart className="text-pink-500" size={20} />
            专业干预建议
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`
                    text-[10px] uppercase font-bold px-2 py-0.5 rounded-full
                    ${rec.type === 'immediate' ? 'bg-blue-100 text-blue-700' : rec.type === 'professional' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}
                  `}>
                    {rec.type === 'immediate' ? '即时调节' : rec.type === 'professional' ? '专业治疗' : '生活方式'}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-700 mb-1">{rec.title}</h4>
                <p className="text-xs text-slate-500 leading-normal">{rec.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pb-8">
           <button className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:bg-white bg-slate-50 rounded-xl transition-colors border border-slate-200 font-medium">
             <Download size={18} />
             导出 PDF 档案
           </button>
           
           {!isAdmin && (
             <button 
               onClick={onContinueToCounseling}
               className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:shadow-xl hover:-translate-y-0.5 font-bold flex items-center gap-2"
             >
               进入心理疏导 ({counselingAgentName})
               <ArrowRight size={18} />
             </button>
           )}
        </div>

        <div className="text-center text-xs text-slate-400 max-w-2xl mx-auto pb-4">
          声明：本报告由人工智能基于对话内容自动生成，仅供参考，不具有医疗诊断效力。
          如您感到极度不适或有自伤倾向，请立即寻求线下专业医生帮助或拨打心理援助热线。
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
