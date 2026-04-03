type ObserverCallback = (timeLeft: number, answersSaved: number) => void;

export class AssessmentTracker {
  private observers: ObserverCallback[] = [];
  private currentAnswersSaved: number = 0;
  private timeLeftSeconds: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(initialTimeLimitSeconds: number) {
    this.timeLeftSeconds = initialTimeLimitSeconds;
  }

  // Observer Pattern: add listeners
  subscribe(observer: ObserverCallback) {
    this.observers.push(observer);
  }

  private notifyObservers() {
    for (const observer of this.observers) {
      observer(this.timeLeftSeconds, this.currentAnswersSaved);
    }
  }

  // Strategy Pattern usage: modifying behavior on the fly
  startTimer() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      if (this.timeLeftSeconds > 0) {
        this.timeLeftSeconds--;
        this.notifyObservers();
      } else {
        this.stopTimer();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Auto-save simulation
  recordAnswer() {
    this.currentAnswersSaved++;
    
    // Simulate auto-saving to DB logic here
    console.log('[Auto-Save Triggered]: Backing up to database...');
    
    this.notifyObservers();
  }
}
