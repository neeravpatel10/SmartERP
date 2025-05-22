// Simple toast utility to use as placeholder until react-hot-toast can be properly installed
export const toast = {
  success: (message: string) => {
    console.log(`SUCCESS: ${message}`);
    // In a real implementation, you would show a success toast
  },
  error: (message: string) => {
    console.error(`ERROR: ${message}`);
    // In a real implementation, you would show an error toast
  },
  loading: (message: string) => {
    console.log(`LOADING: ${message}`);
    // In a real implementation, you would show a loading toast
    return message; // Return an ID for the toast
  },
  dismiss: (toastId: string) => {
    console.log(`DISMISSED: ${toastId}`);
    // In a real implementation, you would dismiss the toast
  }
};

export default toast;
