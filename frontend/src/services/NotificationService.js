interface NotificationData {
  type: 'new-message' | 'chat-created' | 'user-joined' | 'user-left' | 'mention';
  title: string;
  message: string;
  chatId?: number;
  senderId?: number;
  senderName?: string;
  hasFile?: boolean;
  timestamp: Date;
  sound?: boolean;
  desktop?: boolean;
  persist?: boolean;
}

class NotificationService {
  private isEnabled: boolean = true;
  private soundEnabled: boolean = true;
  private desktopEnabled: boolean = false;
  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    this.initializeSounds();
    this.requestPermissions();
  }

  // Inicializar sons de notificação
  private initializeSounds() {
    // Som para mensagem nova
    this.sounds.message = new Audio();
    this.sounds.message.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmscDEpy0fPTgjMGHm7A7+OZURE';
    this.sounds.message.volume = 0.3;

    // Som para mention/destaque
    this.sounds.mention = new Audio();
    this.sounds.mention.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmscDEpy0fPTgjMGHm7A7+OZURE';
    this.sounds.mention.volume = 0.5;

    // Som para arquivo recebido
    this.sounds.file = new Audio();
    this.sounds.file.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmscDEpy0fPTgjMGHm7A7+OZURE';
    this.sounds.file.volume = 0.4;
  }

  // Solicitar permissões do browser
  private async requestPermissions() {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        this.desktopEnabled = permission === 'granted';
      }
    } catch (error) {
      console.warn('Erro ao solicitar permissões de notificação:', error);
    }
  }

  // Configurar preferências
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('chat_notifications_enabled', enabled.toString());
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('chat_sound_enabled', enabled.toString());
  }

  setDesktopEnabled(enabled: boolean) {
    this.desktopEnabled = enabled;
    localStorage.setItem('chat_desktop_enabled', enabled.toString());
  }

  // Carregar preferências salvas
  loadPreferences() {
    this.isEnabled = localStorage.getItem('chat_notifications_enabled') !== 'false';
    this.soundEnabled = localStorage.getItem('chat_sound_enabled') !== 'false';
    this.desktopEnabled = localStorage.getItem('chat_desktop_enabled') === 'true';
  }

  // Exibir notificação principal
  async show(data: NotificationData) {
    if (!this.isEnabled) return;

    // Tocar som
    if (data.sound !== false && this.soundEnabled) {
      this.playSound(data);
    }

    // Notificação desktop
    if (data.desktop !== false && this.desktopEnabled) {
      this.showDesktopNotification(data);
    }

    // Notificação no app (toast/banner)
    this.showInAppNotification(data);

    // Badge/favicon update
    this.updateBadge();
  }

  // Tocar som baseado no tipo
  private playSound(data: NotificationData) {
    try {
      let sound: HTMLAudioElement;

      switch (data.type) {
        case 'mention':
          sound = this.sounds.mention;
          break;
        case 'new-message':
          sound = data.hasFile ? this.sounds.file : this.sounds.message;
          break;
        default:
          sound = this.sounds.message;
      }

      sound.currentTime = 0;
      sound.play().catch(e => console.warn('Erro ao tocar som:', e));
    } catch (error) {
      console.warn('Erro ao tocar notificação sonora:', error);
    }
  }

  // Notificação desktop do browser
  private showDesktopNotification(data: NotificationData) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const notification = new Notification(data.title, {
        body: data.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        timestamp: data.timestamp.getTime(),
        requireInteraction: data.persist || false,
        silent: false,
        data: {
          chatId: data.chatId,
          senderId: data.senderId,
          type: data.type
        }
      });

      // Auto fechar após 5 segundos se não for persistente
      if (!data.persist) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Clique na notificação
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (data.chatId) {
          // Navegar para o chat (dispatch custom event)
          window.dispatchEvent(new CustomEvent('chat-notification-click', {
            detail: { chatId: data.chatId, senderId: data.senderId }
          }));
        }
        
        notification.close();
      };

    } catch (error) {
      console.warn('Erro ao exibir notificação desktop:', error);
    }
  }

  // Notificação in-app (toast)
  private showInAppNotification(data: NotificationData) {
    // Dispatch evento para componente de toast mostrar
    window.dispatchEvent(new CustomEvent('show-toast-notification', {
      detail: data
    }));
  }

  // Atualizar badge do navegador/favicon
  private updateBadge() {
    try {
      // Tentar usar Badge API se disponível
      if ('navigator' in window && 'setAppBadge' in navigator) {
        // Aqui você pegaria o count real de notificações não lidas
        const unreadCount = this.getUnreadCount();
        if (unreadCount > 0) {
          (navigator as any).setAppBadge(unreadCount);
        } else {
          (navigator as any).clearAppBadge();
        }
      } else {
        // Fallback: atualizar favicon com badge
        this.updateFaviconBadge();
      }
    } catch (error) {
      console.warn('Erro ao atualizar badge:', error);
    }
  }

  // Atualizar favicon com contador
  private updateFaviconBadge() {
    const unreadCount = this.getUnreadCount();
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    
    if (!favicon) return;

    if (unreadCount > 0) {
      // Criar canvas com número
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Desenhar círculo vermelho
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(24, 8, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Desenhar número
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(unreadCount > 99 ? '99+' : unreadCount.toString(), 24, 8);

        favicon.href = canvas.toDataURL('image/png');
      }
    } else {
      // Restaurar favicon original
      favicon.href = '/favicon.ico';
    }
  }

  // Obter count de não lidas (mock)
  private getUnreadCount(): number {
    // Aqui você implementaria a lógica real para contar mensagens não lidas
    return parseInt(localStorage.getItem('chat_unread_count') || '0');
  }

  // Limpar todas as notificações
  clearAll() {
    // Limpar badge
    if ('navigator' in window && 'clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge();
    }
    
    // Restaurar favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = '/favicon.ico';
    }

    // Limpar localStorage
    localStorage.setItem('chat_unread_count', '0');
  }

  // Marcar chat como lido
  markChatAsRead(chatId: number) {
    // Aqui você implementaria a lógica para marcar como lido
    console.log('Marcando chat como lido:', chatId);
    this.updateBadge();
  }

  // Métodos para vibração (mobile)
  vibrate(pattern: number[] = [100, 50, 100]) {
    try {
      if ('navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Vibração não suportada:', error);
    }
  }

  // Notificação para quando alguém está digitando
  showTypingNotification(users: string[], chatTitle: string) {
    if (!this.isEnabled || users.length === 0) return;

    const message = users.length === 1 
      ? `${users[0]} está digitando...`
      : `${users.join(', ')} estão digitando...`;

    // Apenas notificação in-app, sem som
    this.showInAppNotification({
      type: 'new-message',
      title: chatTitle,
      message,
      timestamp: new Date(),
      sound: false,
      desktop: false
    });
  }

  // Teste de notificação
  test() {
    this.show({
      type: 'new-message',
      title: 'Teste de Notificação',
      message: 'Esta é uma mensagem de teste do sistema de chat!',
      timestamp: new Date(),
      sound: true,
      desktop: true
    });
  }

  // Getters para estado atual
  get isNotificationEnabled() { return this.isEnabled; }
  get isSoundEnabled() { return this.soundEnabled; }
  get isDesktopEnabled() { return this.desktopEnabled; }
}

// Singleton instance
const notificationService = new NotificationService();

// Carregar preferências na inicialização
notificationService.loadPreferences();

export default notificationService;