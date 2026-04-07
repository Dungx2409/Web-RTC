import { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const Toast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
    }
  }, [notification]);

  if (!notification) return null;

  const icons = {
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
    error: AlertTriangle
  };

  const colors = {
    warning: 'bg-meet-yellow/20 border-meet-yellow/50 text-meet-yellow',
    success: 'bg-meet-green/20 border-meet-green/50 text-meet-green',
    info: 'bg-meet-blue/20 border-meet-blue/50 text-meet-blue',
    error: 'bg-meet-red/20 border-meet-red/50 text-meet-red'
  };

  const Icon = icons[notification.type] || Info;
  const colorClass = colors[notification.type] || colors.info;

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 
        ${isVisible ? 'animate-slide-up' : 'opacity-0'}
      `}
    >
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border shadow-meet
        ${colorClass}
      `}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{notification.message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 200);
          }}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
