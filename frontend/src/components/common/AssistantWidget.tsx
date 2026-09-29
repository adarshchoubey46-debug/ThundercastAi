import { useEffect, useRef, useState } from 'react';
import { Bot, ExternalLink, MapPin, MessageCircle, Send, ShieldCheck, X } from 'lucide-react';
import type { Alert, AtmosphericObservation } from '../../types/weather';
import { fetchAlerts, fetchObservations } from '../../services/api';

interface AssistantWidgetProps {
  language: 'en' | 'hi';
  onOpenSafety: () => void;
}

interface SafetySite {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
}

const siteStorageKey = 'meghdoot-safety-site';

export function AssistantWidget({ language, onOpenSafety }: AssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{
    role: 'assistant',
    text: language === 'hi'
      ? 'नमस्ते! मैं आपके इलाके के मौसम अलर्ट, स्टेशन अवलोकन और पुष्टि किए गए सुरक्षित स्थान की जानकारी दे सकता हूँ। अपना इलाका पूछें।'
      : 'Hello! I can check local weather alerts, station observations, and your confirmed safe location. Ask about your locality.'
  }]);
  const [observations, setObservations] = useState<AtmosphericObservation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  const hi = language === 'hi';

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchObservations(), fetchAlerts()]).then(([loadedObservations, loadedAlerts]) => {
      if (!mounted) return;
      setObservations(loadedObservations);
      setAlerts(loadedAlerts);
      setDataReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  const getSavedSite = (): SafetySite | null => {
    try {
      const value = localStorage.getItem(siteStorageKey);
      return value ? JSON.parse(value) as SafetySite : null;
    } catch {
      return null;
    }
  };

  const buildAnswer = (rawQuestion: string) => {
    const prompt = rawQuestion.toLocaleLowerCase().trim();
    const shelterQuestion = /shelter|safe place|evacuat|where.*go|आश्रय|शरण|सुरक्षित स्थान|सुरक्षित जगह|निकासी|कहाँ जाए/u.test(prompt);
    const safetyQuestion = /lightning|thunder|storm|rain|flood|safety|बिजली|आकाशीय|तूफान|बारिश|बाढ़|सुरक्षा/u.test(prompt);

    if (shelterQuestion) {
      const site = getSavedSite();
      if (site) {
        return hi
          ? `आपका इस डिवाइस पर पुष्टि किया गया सुरक्षित स्थान: ${site.name}, ${site.address}${site.phone ? ` · संपर्क: ${site.phone}` : ''}. जाने से पहले स्थानीय प्रशासन से पुष्टि करें कि यह खुला और सुरक्षित है। बाढ़ के पानी या तेज तूफान में यात्रा न करें।`
          : `Your confirmed safe location saved on this device is ${site.name}, ${site.address}${site.phone ? ` · Contact: ${site.phone}` : ''}. Confirm with local authorities that it is open and safe before travelling. Do not travel through floodwater or severe storm conditions.`;
      }
      return hi
        ? 'इस डैशबोर्ड में आधिकारिक आश्रय सूची उपलब्ध नहीं है, इसलिए मैं किसी स्थान को आश्रय के रूप में प्रमाणित नहीं कर सकता। पास की पक्की, बंद इमारत के अंदरूनी कमरे में रहें; खिड़कियों, खुले मैदान, छतों और पेड़ों से दूर रहें। निकासी निर्देश के लिए स्थानीय प्रशासन से पुष्टि करें; तत्काल खतरे में 112 पर कॉल करें। आप सुरक्षा और आश्रय पृष्ठ पर अपना पुष्टि किया हुआ सुरक्षित स्थान सहेज सकते हैं।'
        : 'This dashboard has no official shelter directory, so I cannot verify a nearby shelter. For lightning or severe weather, use an enclosed sturdy building and an interior room away from windows; avoid open fields, rooftops, and isolated trees. Confirm evacuation instructions with local authorities. Call 112 for immediate danger. You can save a confirmed safe location on the Safety & Shelters page.';
    }

    if (safetyQuestion) {
      return hi
        ? 'तूफान के दौरान पक्की इमारत के अंदर रहें और खिड़कियों, खुले मैदान, छतों तथा अकेले खड़े पेड़ों से दूर रहें। बाढ़ के पानी में न चलें और स्थानीय प्रशासन के निर्देश मानें। तत्काल खतरे में 112 पर कॉल करें।'
        : 'During a storm, stay inside a sturdy enclosed building, away from windows, open fields, rooftops, and isolated trees. Do not walk or drive through floodwater; follow local authority instructions. Call 112 for immediate danger.';
    }

    const matchedObservation = observations.find((observation) => {
      const location = observation.location.location_name.toLocaleLowerCase();
      return prompt.includes(location) || location.split(/[\s(]+/).some((word) => word.length > 3 && prompt.includes(word));
    });
    const matchedAlert = alerts.find((alert) => {
      const areas = alert.affected_area.toLocaleLowerCase().split(/,|&/).map((area) => area.trim());
      return areas.some((area) => area.length > 3 && prompt.includes(area));
    });

    if (matchedObservation || matchedAlert) {
      const location = matchedObservation?.location.location_name ?? matchedAlert?.affected_area;
      const localAlerts = alerts.filter((alert) => {
        const area = alert.affected_area.toLocaleLowerCase();
        return area.includes(location?.toLocaleLowerCase() ?? '') || location?.toLocaleLowerCase().split(/[\s(]+/).some((word) => word.length > 3 && area.includes(word));
      });
      const weather = matchedObservation
        ? hi
          ? `स्टेशन ${matchedObservation.location.location_name} पर वर्षा ${matchedObservation.rainfall_mm_hr ?? 'उपलब्ध नहीं'} मिमी/घंटा, रडार ${matchedObservation.radar_reflectivity_dbz ?? 'उपलब्ध नहीं'} dBZ और पिछले 15 मिनट में ${matchedObservation.lightning_flashes_count} बिजली चमक दर्ज हुई।`
          : `${matchedObservation.location.location_name} station reports rainfall ${matchedObservation.rainfall_mm_hr ?? 'not available'} mm/h, radar ${matchedObservation.radar_reflectivity_dbz ?? 'not available'} dBZ, and ${matchedObservation.lightning_flashes_count} lightning flashes in the past 15 minutes.`
        : '';
      const warning = (matchedAlert ? [matchedAlert] : localAlerts).map((alert) => `${alert.risk_level}: ${alert.title} (${alert.expected_window})`).join('; ');
      const warningText = warning
        ? hi ? ` संबंधित चेतावनी: ${warning}.` : ` Related alert: ${warning}.`
        : hi ? ' इस इलाके के लिए कोई मेल खाती चेतावनी नहीं मिली।' : ' No matching alert was found for this area.';
      const disclaimer = hi
        ? ' ये डैशबोर्ड स्क्रीनिंग डेटा हैं, आधिकारिक निकासी आदेश नहीं। नवीनतम निर्देश स्थानीय प्रशासन से लें।'
        : ' This is dashboard screening data, not an official evacuation order. Follow the latest local authority instructions.';
      return `${weather}${warningText}${disclaimer}`;
    }

    if (/alert|risk|warning|चेतावनी|जोखिम/u.test(prompt)) {
      if (alerts.length === 0) return hi ? 'अभी कोई सक्रिय चेतावनी उपलब्ध नहीं है।' : 'No active alerts are currently available.';
      const summary = alerts.slice(0, 3).map((alert) => `${alert.risk_level} · ${alert.affected_area} · ${alert.expected_window}`).join('\n');
      return hi
        ? `डैशबोर्ड चेतावनियाँ:\n${summary}\nये स्क्रीनिंग चेतावनियाँ हैं; आधिकारिक निर्देशों के लिए स्थानीय प्रशासन से पुष्टि करें।`
        : `Dashboard alerts:\n${summary}\nThese are screening advisories; confirm official instructions with local authorities.`;
    }

    return hi
      ? 'मैं अभी स्थानीय स्टेशन अवलोकन, जोखिम चेतावनी और सुरक्षित स्थान से जुड़े सवालों में मदद कर सकता हूँ। अपने इलाके का नाम लिखें, जैसे Kolar Road या Bhopal Central; आश्रय के लिए “मुझे सुरक्षित जगह चाहिए” पूछें।'
      : 'I can help with local station readings, risk alerts, and safe-location questions. Try a locality such as Kolar Road or Bhopal Central, or ask “Where can I shelter?”';
  };

  const sendQuestion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitted = question.trim();
    if (!submitted) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: submitted },
      { role: 'assistant', text: dataReady ? buildAnswer(submitted) : hi ? 'स्थानीय मौसम डेटा लोड हो रहा है। थोड़ी देर में फिर पूछें।' : 'Local weather data is loading. Please ask again in a moment.' }
    ]);
    setQuestion('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-60 flex flex-col items-end gap-3">
      {isOpen && (
        <section aria-label="Ask MD Assistant" className="assistant-panel flex max-h-[min(580px,calc(100dvh-6rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-sm border border-slate-300 bg-white shadow-xl">
          <header className="flex items-center justify-between gap-3 bg-[#12345a] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-white/15"><Bot className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">Ask MD Assistant</h2>
                <p className="text-[11px] text-slate-200">{hi ? 'स्थानीय मौसम और सुरक्षा सहायता' : 'Local weather & safety guidance'}</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label={hi ? 'सहायक बंद करें' : 'Close assistant'} className="rounded-sm p-1.5 hover:bg-white/15"><X className="h-4 w-4" /></button>
          </header>

          <div ref={messageListRef} aria-live="polite" className="assistant-messages flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`max-w-[92%] whitespace-pre-line rounded-sm px-3 py-2.5 text-xs leading-relaxed ${message.role === 'user' ? 'ml-auto bg-[#12345a] text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                {index === 0 && messages.length === 1
                  ? hi
                    ? 'नमस्ते! मैं आपके इलाके के मौसम अलर्ट, स्टेशन अवलोकन और पुष्टि किए गए सुरक्षित स्थान की जानकारी दे सकता हूँ। अपना इलाका पूछें।'
                    : 'Hello! I can check local weather alerts, station observations, and your confirmed safe location. Ask about your locality.'
                  : message.text}
              </div>
            ))}
            {!dataReady && <p className="text-center text-[11px] text-slate-500">{hi ? 'मौसम डेटा लोड हो रहा है…' : 'Loading local weather data…'}</p>}
          </div>

          <button type="button" onClick={onOpenSafety} className="flex items-center justify-center gap-2 border-t border-slate-200 px-3 py-2 text-xs font-semibold text-[#175a91] hover:bg-blue-50">
            <ShieldCheck className="h-4 w-4" />{hi ? 'पुष्टि किया हुआ सुरक्षित स्थान जोड़ें' : 'Add a confirmed safe location'}<ExternalLink className="h-3 w-3" />
          </button>
          <form onSubmit={sendQuestion} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <label className="sr-only" htmlFor="assistant-question">{hi ? 'अपना सवाल लिखें' : 'Ask a question'}</label>
            <input id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={hi ? 'इलाका या सवाल लिखें…' : 'Ask about your locality…'} className="min-w-0 flex-1 rounded-sm border border-slate-300 px-3 py-2 text-xs text-slate-800" />
            <button type="submit" disabled={!question.trim()} aria-label={hi ? 'भेजें' : 'Send'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#12345a] text-white hover:bg-[#175a91] disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
          <p className="px-3 pb-2 text-center text-[10px] text-slate-500">{hi ? 'तत्काल खतरे में 112 पर कॉल करें' : 'For immediate danger, call 112'}</p>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label={isOpen ? (hi ? 'सहायक बंद करें' : 'Close Ask MD Assistant') : 'Ask MD Assistant'} className="flex items-center gap-2 rounded-sm bg-[#12345a] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#175a91]">
        {isOpen ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        <span>{isOpen ? (hi ? 'बंद करें' : 'Close') : 'Ask MD Assistant'}</span>
        {!isOpen && <MapPin className="h-4 w-4" />}
      </button>
    </div>
  );
}