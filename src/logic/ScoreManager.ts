export default class ScoreManager {
  private score: number = 0;
  private combo: number = 0;
  private listeners: ((score: number) => void)[] = [];

  /** Add points and trigger any score listeners */
  addPoints(points: number) {
    this.score += points;
    this.notify();
  }
  
  /** Add points and increase combo multiplier */
  addCombo(points: number) {
    this.combo++;
    this.addPoints(points * this.combo);
  }

  /** Reset combo (e.g., when missing a note) */
  resetCombo() {
    this.combo = 0;
  }

  /** Get current score */
  getScore(): number {
    return this.score;
  }

  /** Register a callback to update UI */
  onScoreChange(listener: (score: number) => void) {
    this.listeners.push(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.score));
  }
}
