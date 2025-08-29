import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  Users, 
  FileText, 
  Image, 
  Headphones, 
  Video,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface ToastData {
  id: string;
  type: 'new-message' | 'chat-created' | 'user-joined' | 'user-left' | 'mention' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  chatId?: number;
  senderId?: number;
  senderName?: string;
  hasFile?: boolean;
  timestamp: Date;
  persist?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast extends ToastData {
  isVisible: boolean;
  isLeaving: boolean;
}

const ToastNotification: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Escutar eventos de notificação
    const handleToastNotification = (event: CustomEvent) => {
      const data = event.detail as ToastData;
      showToast(data);
    };

    window.addEventListener('show-toast-notification', handleToastNotification as EventListener);

    return () => {
      window.removeEventListener('show-toast-notification', handleToastNotification as EventListener);
    };
  }, []);

  const showToast = (data: ToastData) => {
    const toast: Toast = {
      ...data,
      id: data.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isVisible: true,
      isLeaving: false
    };

    setToasts(prev => [...prev, toast]);

    // Auto remover se não for persistente
    if (!data.persist) {
      setTimeout(() => {
        removeToast(toast.id);
      }, 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id 
          ? { ...toast, isLeaving: true }
          : toast
      )
    );

    // Remover completamente após animação
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  };

  const getToastIcon = (type: string, hasFile?: boolean) => {
    const iconProps = { size: 20, className: "flex-shrink-0" };

    switch (type) {
      case 'new-message':
        if (hasFile) return <FileText {...iconProps} />;
        return <MessageCircle {...iconProps} />;
      case 'chat-created':
        return <Users {...iconProps} />;
      case 'user-joined':
      case 'user-left':
        return <Users {...iconProps} />;
      case 'mention':
        return <AlertCircle {...iconProps} />;
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'info':
        return <Info {...iconProps} />;
      default:
        return <MessageCircle {...iconProps} />;
    }
  };

  const getToastColors = (type: string) => {
    switch (type) {
      case 'new-message':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-400',
          text: 'text-blue-50',
          icon: 'text-blue-100'
        };
      case 'mention':
        return {
          bg: 'bg-orange-500',
          border: 'border-orange-400',
          text: 'text-orange-50',
          icon: 'text-orange-100'
        };
      case 'chat-created':
      case 'user-joined':
        return {
          bg: 'bg-green-500',
          border: 'border-green-400',
          text: 'text-green-50',
          icon: 'text-green-100'
        };
      case 'user-left':
        return {
          bg: 'bg-gray-500',
          border: 'border-gray-400',
          text: 'text-gray-50',
          icon: 'text-gray-100'
        };
      case 'success':
        return {
          bg: 'bg-green-600',
          border: 'border-green-500',
          text: 'text-green-50',
          icon: 'text-green-100'
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          border: 'border-red-400',
          text: 'text-red-50',
          icon: 'text-red-100'
        };
      case 'info':
        return {
          bg: 'bg-gray-600',
          border: 'border-gray-500',
          text: 'text-gray-50',
          icon: 'text-gray-100'
        };
      default:
        return {
          bg: 'bg-gray-700',
          border: 'border-gray-600',
          text: 'text-gray-50',
          icon: 'text-gray-100'
        };
    }
  };

  const handleToastClick = (toast: Toast) => {
    if (toast.chatId) {
      // Navegar para o chat
      window.dispatchEvent(new CustomEvent('navigate-to-chat', {
        detail: { chatId: toast.chatId, senderId: toast.senderId }
      }));
    }
    
    if (toast.action) {
      toast.action.onClick();
    }
    
    removeToast(toast.id);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const colors = getToastColors(toast.type);
        
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto max-w-sm w-full
              ${colors.bg} ${colors.border} ${colors.text}
              border rounded-lg shadow-lg
              transform transition-all duration-300 ease-in-out
              ${toast.isVisible && !toast.isLeaving 
                ? 'translate-x-0 opacity-100 scale-100' 
                : 'translate-x-full opacity-0 scale-95'
              }
              hover:scale-105 cursor-pointer
            `}
            onClick={() => handleToastClick(toast)}
          >
            <div className="p-4">
              <div className="flex items-start space-x-3">
                {/* Ícone */}
                <div className={`${colors.icon} mt-0.5`}>
                  {getToastIcon(toast.type, toast.hasFile)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {toast.title}
                      </p>
                      <p className="text-sm opacity-90 mt-1">
                        {toast.message}
                      </p>
                      
                      {/* Informações extras */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-75">
                          {toast.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        
                        {toast.hasFile && (
                          <span className="text-xs opacity-75 flex items-center">
                            <FileText size={12} className="mr-1" />
                            Arquivo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botão fechar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeToast(toast.id);
                      }}
                      className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Botão de ação */}
                  {toast.action && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.action!.onClick();
                        removeToast(toast.id);
                      }}
                      className="mt-2 text-xs font-medium underline hover:no-underline"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
              </div>

              {/* Barra de progresso para toasts temporários */}
              {!toast.persist && (
                <div className="mt-3 h-1 bg-black bg-opacity-20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white bg-opacity-60 rounded-full transition-all duration-5000 ease-linear"
                    style={{
                      width: toast.isLeaving ? '100%' : '0%',
                      transitionDuration: toast.isLeaving ? '0s' : '5000ms'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastNotification;