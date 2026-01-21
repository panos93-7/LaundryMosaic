export const Analytics = {
  track: async (eventName: string, params: Record<string, any> = {}) => {
    try {
      console.log("Analytics event:", eventName, params);
    } catch (error) {
      console.log("Analytics error:", error);
    }
  }
};