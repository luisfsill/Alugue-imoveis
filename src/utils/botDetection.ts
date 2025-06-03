/**
 * 🤖 Sistema Avançado de Detecção de Bots
 * 
 * Usa múltiplas técnicas de fingerprinting para identificar comportamentos suspeitos:
 * - Fingerprint do dispositivo (tela, hardware, timezone)
 * - Análise comportamental (velocidade, padrões)
 * - Detecção de automação (webdriver, headless browsers)
 * - Validação de interação humana
 */

import { sha256 } from 'js-sha256';

// Interfaces para tipagem
export interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0-100, onde 100 = certeza de bot
  reasons: string[];
  fingerprint: string;
  riskScore: number;
}

export interface DeviceFingerprint {
  screen: string;
  timezone: string;
  language: string;
  userAgent: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  colorDepth: number;
  touchSupport: boolean;
  cookiesEnabled: boolean;
  webglFingerprint: string;
  canvasFingerprint: string;
  audioFingerprint: string;
}

export interface BehaviorAnalysis {
  mouseMovements: number;
  keyboardInteractions: number;
  scrollEvents: number;
  clickPatterns: number[];
  timeOnPage: number;
  interactionSpeed: number;
  suspiciousPatterns: string[];
}

class BotDetectionSystem {
  private behaviorData: BehaviorAnalysis = {
    mouseMovements: 0,
    keyboardInteractions: 0,
    scrollEvents: 0,
    clickPatterns: [],
    timeOnPage: 0,
    interactionSpeed: 0,
    suspiciousPatterns: []
  };

  private startTime: number = Date.now();

  constructor() {
    this.initializeBehaviorTracking();
  }

  /**
   * Gerar fingerprint completo do dispositivo
   */
  public generateDeviceFingerprint(): DeviceFingerprint {
    const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.languages ? navigator.languages.join(',') : navigator.language;
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Detecção avançada de hardware
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    const deviceMemory = (navigator as any).deviceMemory || 0;
    const colorDepth = window.screen.colorDepth || 24;
    
    // Detecção de toque
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Cookies habilitados
    const cookiesEnabled = navigator.cookieEnabled;
    
    // Fingerprints mais avançados
    const webglFingerprint = this.getWebGLFingerprint();
    const canvasFingerprint = this.getCanvasFingerprint();
    const audioFingerprint = this.getAudioFingerprint();

    return {
      screen,
      timezone,
      language,
      userAgent,
      platform,
      hardwareConcurrency,
      deviceMemory,
      colorDepth,
      touchSupport,
      cookiesEnabled,
      webglFingerprint,
      canvasFingerprint,
      audioFingerprint
    };
  }

  /**
   * WebGL fingerprinting
   */
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      
      if (!gl) return 'no-webgl';
      
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      const extensions = gl.getSupportedExtensions()?.join(',') || '';
      
      return sha256(`${renderer}|${vendor}|${extensions}`).substring(0, 16);
    } catch (error) {
      return 'webgl-error';
    }
  }

  /**
   * Canvas fingerprinting
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return 'no-canvas';
      
      // Desenhar texto com diferentes fontes e estilos
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Bot Detection 🤖', 2, 2);
      
      ctx.font = '11px Times';
      ctx.fillText('Fingerprinting Test', 4, 17);
      
      // Adicionar formas geométricas
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.beginPath();
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      
      return sha256(canvas.toDataURL()).substring(0, 16);
    } catch (error) {
      return 'canvas-error';
    }
  }

  /**
   * Audio fingerprinting
   */
  private getAudioFingerprint(): string {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
      
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;
      
      gain.gain.value = 0;
      
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);
      gain.connect(context.destination);
      
      oscillator.start(0);
      
      const fingerprint = `${context.sampleRate}|${analyser.frequencyBinCount}`;
      
      // Limpar recursos
      oscillator.stop(0);
      context.close();
      
      return sha256(fingerprint).substring(0, 16);
    } catch (error) {
      return 'audio-error';
    }
  }

  /**
   * Detectar sinais de automação
   */
  private detectAutomationSignals(): string[] {
    const signals: string[] = [];
    
    // Detecção de WebDriver
    if (typeof (window as any).webdriver !== 'undefined') {
      signals.push('webdriver-detected');
    }
    
    // Propriedades do navegador suspeitas
    if (typeof (window as any).callPhantom === 'function') {
      signals.push('phantomjs-detected');
    }
    
    if (typeof (window as any)._phantom !== 'undefined') {
      signals.push('phantom-property');
    }
    
    // Selenium detection
    if (typeof (document as any).documentElement.getAttribute === 'function' &&
        (document as any).documentElement.getAttribute('selenium')) {
      signals.push('selenium-detected');
    }
    
    // Headless Chrome detection
    if (navigator.webdriver === true) {
      signals.push('chrome-headless');
    }
    
    // Puppeteer detection
    if (typeof (window as any).chrome !== 'undefined' && 
        typeof (window as any).chrome.runtime === 'undefined') {
      signals.push('puppeteer-suspected');
    }
    
    // User-Agent suspeito
    const ua = navigator.userAgent;
    if (ua.includes('HeadlessChrome') || 
        ua.includes('PhantomJS') || 
        ua.includes('SlimerJS')) {
      signals.push('suspicious-useragent');
    }
    
    // Verificar plugins faltando
    if (navigator.plugins.length === 0) {
      signals.push('no-plugins');
    }
    
    // Verificar linguagens
    if (navigator.languages && navigator.languages.length === 0) {
      signals.push('no-languages');
    }
    
    return signals;
  }

  /**
   * Analisar comportamento do usuário
   */
  public analyzeBehavior(): BehaviorAnalysis {
    const now = Date.now();
    this.behaviorData.timeOnPage = now - this.startTime;
    
    // Calcular velocidade de interação
    if (this.behaviorData.keyboardInteractions > 0 || this.behaviorData.mouseMovements > 0) {
      const totalInteractions = this.behaviorData.keyboardInteractions + this.behaviorData.mouseMovements;
      this.behaviorData.interactionSpeed = totalInteractions / (this.behaviorData.timeOnPage / 1000);
    }
    
    // Detectar padrões suspeitos
    const suspiciousPatterns: string[] = [];
    
    // Velocidade de interação muito alta (robô)
    if (this.behaviorData.interactionSpeed > 50) {
      suspiciousPatterns.push('high-interaction-speed');
    }
    
    // Nenhuma interação em muito tempo
    if (this.behaviorData.timeOnPage > 30000 && 
        this.behaviorData.mouseMovements === 0 && 
        this.behaviorData.keyboardInteractions === 0) {
      suspiciousPatterns.push('no-human-interaction');
    }
    
    // Padrões de clique muito regulares
    if (this.behaviorData.clickPatterns.length > 5) {
      const intervals = this.behaviorData.clickPatterns.slice(1).map((time, i) => 
        time - this.behaviorData.clickPatterns[i]
      );
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => 
        sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      if (variance < 100) { // Cliques muito regulares
        suspiciousPatterns.push('regular-click-pattern');
      }
    }
    
    this.behaviorData.suspiciousPatterns = suspiciousPatterns;
    return this.behaviorData;
  }

  /**
   * Executar detecção completa de bot
   */
  public async detectBot(): Promise<BotDetectionResult> {
    const deviceFingerprint = this.generateDeviceFingerprint();
    const behaviorAnalysis = this.analyzeBehavior();
    const automationSignals = this.detectAutomationSignals();
    
    // Gerar fingerprint único
    const fingerprintData = JSON.stringify(deviceFingerprint);
    const fingerprint = sha256(fingerprintData).substring(0, 32);
    
    // Calcular score de risco
    let riskScore = 0;
    const reasons: string[] = [];
    
    // Sinais de automação (peso alto)
    if (automationSignals.length > 0) {
      riskScore += automationSignals.length * 30;
      reasons.push(`Sinais de automação: ${automationSignals.join(', ')}`);
    }
    
    // Comportamento suspeito
    if (behaviorAnalysis.suspiciousPatterns.length > 0) {
      riskScore += behaviorAnalysis.suspiciousPatterns.length * 20;
      reasons.push(`Comportamento suspeito: ${behaviorAnalysis.suspiciousPatterns.join(', ')}`);
    }
    
    // Hardware suspeito
    if (deviceFingerprint.hardwareConcurrency === 0) {
      riskScore += 15;
      reasons.push('Hardware concurrency não disponível');
    }
    
    if (!deviceFingerprint.cookiesEnabled) {
      riskScore += 10;
      reasons.push('Cookies desabilitados');
    }
    
    // User-Agent suspeito
    if (deviceFingerprint.userAgent.length < 50) {
      riskScore += 20;
      reasons.push('User-Agent muito curto');
    }
    
    // Sem interação humana
    if (behaviorAnalysis.mouseMovements === 0 && behaviorAnalysis.timeOnPage > 10000) {
      riskScore += 25;
      reasons.push('Sem movimentos de mouse');
    }
    
    // Determinar se é bot
    const isBot = riskScore >= 50;
    const confidence = Math.min(riskScore, 100);
    
    console.log('🤖 Bot Detection Result:', {
      isBot,
      confidence,
      riskScore,
      fingerprint: fingerprint.substring(0, 8) + '...',
      reasons: reasons.length
    });
    
    return {
      isBot,
      confidence,
      reasons,
      fingerprint,
      riskScore
    };
  }

  /**
   * Inicializar rastreamento de comportamento
   */
  private initializeBehaviorTracking(): void {
    // Rastrear movimentos do mouse
    document.addEventListener('mousemove', () => {
      this.behaviorData.mouseMovements++;
    }, { passive: true });
    
    // Rastrear interações do teclado
    document.addEventListener('keydown', () => {
      this.behaviorData.keyboardInteractions++;
    }, { passive: true });
    
    // Rastrear eventos de scroll
    document.addEventListener('scroll', () => {
      this.behaviorData.scrollEvents++;
    }, { passive: true });
    
    // Rastrear padrões de clique
    document.addEventListener('click', () => {
      this.behaviorData.clickPatterns.push(Date.now());
      
      // Manter apenas os últimos 20 cliques
      if (this.behaviorData.clickPatterns.length > 20) {
        this.behaviorData.clickPatterns = this.behaviorData.clickPatterns.slice(-20);
      }
    }, { passive: true });
  }

  /**
   * Obter dados de comportamento atual
   */
  public getBehaviorData(): BehaviorAnalysis {
    return { ...this.behaviorData };
  }

  /**
   * Reset dos dados de comportamento
   */
  public resetBehaviorData(): void {
    this.behaviorData = {
      mouseMovements: 0,
      keyboardInteractions: 0,
      scrollEvents: 0,
      clickPatterns: [],
      timeOnPage: 0,
      interactionSpeed: 0,
      suspiciousPatterns: []
    };
    this.startTime = Date.now();
  }
}

// Instância singleton
export const botDetection = new BotDetectionSystem();

// Utilitários adicionais
export const BotDetectionUtils = {
  /**
   * Verificação rápida de bot
   */
  async quickBotCheck(): Promise<boolean> {
    const result = await botDetection.detectBot();
    return result.isBot;
  },

  /**
   * Obter fingerprint do dispositivo
   */
  getDeviceFingerprint(): string {
    const fingerprint = botDetection.generateDeviceFingerprint();
    return sha256(JSON.stringify(fingerprint)).substring(0, 32);
  },

  /**
   * Verificar se o comportamento parece humano
   */
  isHumanBehavior(): boolean {
    const behavior = botDetection.getBehaviorData();
    return behavior.mouseMovements > 0 || behavior.keyboardInteractions > 0;
  },

  /**
   * Aguardar interação humana antes de prosseguir
   */
  async waitForHumanInteraction(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkInteraction = () => {
        if (this.isHumanBehavior()) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeoutMs) {
          resolve(false);
          return;
        }
        
        setTimeout(checkInteraction, 1000);
      };
      
      checkInteraction();
    });
  }
}; 