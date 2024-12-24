type ObjectState = {
  id: string;
  name: string; 
  type: 'rectangle' | 'circle' | 'marker' | 'polygon';
  data: any;
  color: string;
  opacity?: number;
  visible: boolean;
};

class UndoRedoManager {
  private history: ObjectState[][] = [];
  private currentIndex = -1;
  private maxHistory: number;

  constructor(maxHistory: number = 10) {
    this.maxHistory = maxHistory;
  }

  /** Push a new version of the entire objects array into history */
  addState(newState: ObjectState[]) {
    // If we undid some states before, discard all states ahead
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new snapshot
    this.history.push(JSON.parse(JSON.stringify(newState))); // Deep copy to avoid reference issues
    this.currentIndex = this.history.length - 1;

    // Limit the max number of snapshots
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): ObjectState[] | null {
    if (this.canUndo()) {
      this.currentIndex--;
      // Return a **copy** to avoid accidental mutations from outside
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  redo(): ObjectState[] | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrentState(): ObjectState[] {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return [];
  }
}

export default UndoRedoManager;
