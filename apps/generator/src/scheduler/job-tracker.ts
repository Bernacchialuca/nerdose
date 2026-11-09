export type JobTracker = {
  track<T>(promise: Promise<T>): Promise<T>;
  idle(): Promise<void>;
};

export function createJobTracker(): JobTracker {
  const pending = new Set<Promise<unknown>>();

  return {
    track(promise) {
      pending.add(promise);
      const forget = () => pending.delete(promise);
      promise.then(forget, forget);
      return promise;
    },
    async idle() {
      while (pending.size > 0) {
        await Promise.allSettled([...pending]);
      }
    },
  };
}
