import React, { useState } from 'react';
import { Slide } from '../types';
import { Trash2, Wand2, Play, RefreshCw, Clock, Plus } from 'lucide-react';
import { generateSlidePlan } from '../services/geminiService';

interface SetupViewProps {
  initialSlides: Slide[];
  onStart: (slides: Slide[]) => void;
}

const SetupView: React.FC<SetupViewProps> = ({ initialSlides, onStart }) => {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [totalTimeMin, setTotalTimeMin] = useState(20);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Recalculate if user changes total time in basic mode
  const distributeTimeEvenly = () => {
    if (slides.length === 0) return;
    const timePerSlide = Math.floor((totalTimeMin * 60) / slides.length);
    const newSlides = slides.map(s => ({ ...s, durationSeconds: timePerSlide }));
    setSlides(newSlides);
  };

  const handleTotalTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setTotalTimeMin(val);
  };

  const handleSlideCountChange = (newCount: number) => {
    if (newCount < 1) return;
    let newSlides = [...slides];
    
    if (newCount > slides.length) {
      // Add slides
      const addedCount = newCount - slides.length;
      for (let i = 0; i < addedCount; i++) {
        const nextNum = newSlides.length + 1;
        newSlides.push({
          id: crypto.randomUUID(),
          number: nextNum,
          title: `Diapositive ${nextNum}`,
          durationSeconds: 60 
        });
      }
    } else {
      // Remove slides
      newSlides = newSlides.slice(0, newCount);
    }
    
    // Auto distribute roughly
    const timePerSlide = Math.floor((totalTimeMin * 60) / newSlides.length);
    newSlides = newSlides.map((s, idx) => ({ ...s, number: idx + 1, durationSeconds: timePerSlide }));
    
    setSlides(newSlides);
  };

  const handleGenerateAI = async () => {
    if (!topic) return;
    setIsGenerating(true);
    const plan = await generateSlidePlan(topic, slides.length, totalTimeMin);
    setIsGenerating(false);

    if (plan && plan.slides) {
      const newSlides = plan.slides.map((s, idx) => ({
        id: crypto.randomUUID(),
        number: idx + 1,
        title: s.title,
        durationSeconds: s.durationSeconds
      }));
      setSlides(newSlides);
    }
  };

  const updateSlide = (id: string, field: keyof Slide, value: any) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSlide = (id: string) => {
    const newSlides = slides.filter(s => s.id !== id).map((s, idx) => ({...s, number: idx + 1}));
    setSlides(newSlides);
  };

  const addSlide = () => {
     handleSlideCountChange(slides.length + 1);
  };

  // Calculate actual total from slides
  const currentTotalSeconds = slides.reduce((acc, s) => acc + s.durationSeconds, 0);
  const currentTotalMin = (currentTotalSeconds / 60).toFixed(1);

  return (
    <div className="w-full max-w-5xl mx-auto p-6 min-h-screen flex flex-col">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
          ChronoSlide
        </h1>
        <p className="text-slate-400">Préparez et maîtrisez votre temps de parole</p>
      </header>

      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800 flex-grow">
        
        {/* Top Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Basic Settings */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" /> Paramètres Généraux
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Durée (min)</label>
                <input 
                  type="number" 
                  value={totalTimeMin} 
                  onChange={handleTotalTimeChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Diapositives</label>
                <div className="flex items-center">
                  <input 
                    type="number"
                    value={slides.length}
                    readOnly
                    className="w-full bg-slate-800 border border-slate-700 rounded-l-lg p-3 text-xl font-mono text-center outline-none"
                  />
                  <div className="flex flex-col border-l border-slate-700">
                     <button onClick={() => handleSlideCountChange(slides.length + 1)} className="bg-slate-800 hover:bg-slate-700 p-1 px-3 border-b border-slate-700 rounded-tr-lg transition-colors">+</button>
                     <button onClick={() => handleSlideCountChange(slides.length - 1)} className="bg-slate-800 hover:bg-slate-700 p-1 px-3 rounded-br-lg transition-colors">-</button>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={distributeTimeEvenly}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-all group"
            >
              <RefreshCw className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
              Répartir le temps équitablement
            </button>
          </div>
          
          {/* Right Column: AI Assistant */}
          <div className="space-y-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
             <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400" /> Assistant IA
            </h2>
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Sujet de la présentation</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Stratégie Marketing Q4..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
              />
              <button 
                onClick={handleGenerateAI}
                disabled={!topic || isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isGenerating ? 'Génération...' : 'Générer un plan intelligent'}
              </button>
            </div>
          </div>
        </div>

        {/* Slides List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold text-slate-200">Détail des diapositives</h2>
             <span className={`text-sm font-mono px-3 py-1 rounded-full ${Math.abs(parseFloat(currentTotalMin) - totalTimeMin) > 0.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
               Total calculé: {currentTotalMin} min
             </span>
          </div>

          <div className="bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
             <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-3 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
               <div className="pl-2">#</div>
               <div>Titre</div>
               <div className="text-center">Durée (sec)</div>
               <div className="w-10"></div>
             </div>
             <div className="max-h-[400px] overflow-y-auto">
               {slides.map((slide) => (
                 <div key={slide.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-3 border-b border-slate-800/50 items-center hover:bg-slate-800/30 transition-colors">
                   <div className="pl-2 font-mono text-slate-500 w-6">{slide.number}</div>
                   <input 
                      type="text" 
                      value={slide.title}
                      onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                      className="bg-transparent text-slate-200 outline-none border-b border-transparent focus:border-blue-500 placeholder-slate-600"
                      placeholder="Titre de la diapositive"
                   />
                   <div className="flex items-center justify-center">
                     <input 
                        type="number"
                        value={slide.durationSeconds}
                        onChange={(e) => updateSlide(slide.id, 'durationSeconds', parseInt(e.target.value) || 0)}
                        className="bg-slate-800 w-20 text-center rounded p-1 font-mono text-sm border border-slate-700 focus:border-blue-500 outline-none"
                     />
                   </div>
                   <div className="w-10 flex justify-end">
                     <button onClick={() => removeSlide(slide.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               ))}
               <div className="p-2 flex justify-center border-t border-slate-800">
                  <button onClick={addSlide} className="flex items-center gap-2 text-slate-500 hover:text-blue-400 text-sm py-2 px-4 rounded transition-colors">
                    <Plus className="w-4 h-4" /> Ajouter une diapositive
                  </button>
               </div>
             </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center">
           <button 
             onClick={() => onStart(slides)}
             className="px-12 py-4 bg-green-600 hover:bg-green-500 text-white text-lg font-bold rounded-full shadow-lg shadow-green-900/20 hover:shadow-green-900/40 transform hover:scale-105 transition-all flex items-center gap-3"
           >
             <Play className="w-6 h-6 fill-current" />
             Lancer la Présentation
           </button>
        </div>

      </div>
    </div>
  );
};

export default SetupView;